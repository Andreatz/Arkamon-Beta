use std::{fs::File, io::{Read, Seek, SeekFrom}, path::{Path, PathBuf}};

pub struct Resource { pub bytes: Vec<u8>, pub mime: &'static str, pub start: u64, pub end: u64, pub size: u64, pub partial: bool }

fn decode_path(value: &str) -> Option<String> {
    let input = value.as_bytes(); let mut result = Vec::with_capacity(input.len()); let mut index = 0;
    while index < input.len() {
        if input[index] == b'%' {
            if index + 2 >= input.len() { return None; }
            let hex = std::str::from_utf8(&input[index + 1..index + 3]).ok()?;
            result.push(u8::from_str_radix(hex, 16).ok()?); index += 3;
        } else { result.push(input[index]); index += 1; }
    }
    String::from_utf8(result).ok()
}

fn resource_path(root: &Path, request: &str) -> Option<PathBuf> {
    let decoded = decode_path(request)?;
    let relative = decoded.strip_prefix('/')?;
    if relative.is_empty() || relative.contains('\\') || relative.contains(':') || relative.chars().any(|c| c.is_control())
        || relative.split('/').any(|part| part.is_empty() || part == "." || part == "..") { return None; }
    let first = relative.split('/').next()?;
    if !["ui", "maps", "backgrounds", "assets", "sprites", "audio", "audio-lab"].contains(&first) { return None; }
    let canonical_root = root.canonicalize().ok()?;
    let target = root.join(relative).canonicalize().ok()?;
    if !target.starts_with(canonical_root) || !target.is_file() { return None; }
    Some(target)
}

fn mime(path: &Path) -> Option<&'static str> {
    Some(match path.extension()?.to_str()?.to_ascii_lowercase().as_str() {
        "png" => "image/png", "webp" => "image/webp", "jpg" | "jpeg" => "image/jpeg", "svg" => "image/svg+xml",
        "gif" => "image/gif", "avif" => "image/avif", "ico" => "image/x-icon", "mp4" => "video/mp4", "webm" => "video/webm",
        "ogg" => "audio/ogg", "mp3" => "audio/mpeg", "wav" => "audio/wav", "m4a" => "audio/mp4", "flac" => "audio/flac",
        "woff" => "font/woff", "woff2" => "font/woff2", "ttf" => "font/ttf", "otf" => "font/otf", "json" => "application/json",
        _ => return None,
    })
}

fn byte_range(range: Option<&str>, size: u64) -> Option<(u64, u64, bool)> {
    if size == 0 { return Some((0, 0, false)); }
    if let Some(header) = range {
        let value = header.strip_prefix("bytes=")?;
        if value.contains(',') { return None; }
        let (left, right) = value.split_once('-')?;
        let (start, end) = if left.is_empty() {
            let suffix = right.parse::<u64>().ok()?;
            if suffix == 0 { return None; }
            (size.saturating_sub(suffix), size - 1)
        } else { (left.parse::<u64>().ok()?, if right.is_empty() { size - 1 } else { right.parse::<u64>().ok()?.min(size - 1) }) };
        if start >= size || end < start { return None; }
        // A video decoder can continue requesting ranges without allocating a
        // whole movie or atlas in Rust for every seek.
        return Some((start, end.min(start.saturating_add(8 * 1024 * 1024 - 1)), true));
    }
    if size > 128 * 1024 * 1024 { return None; }
    Some((0, size - 1, false))
}

pub fn read_resource(root: &Path, request: &str, range: Option<&str>, head: bool) -> Option<Resource> {
    let path = resource_path(root, request)?;
    let content_type = mime(&path)?;
    let mut file = File::open(path).ok()?; let size = file.metadata().ok()?.len();
    let (start, end, partial) = byte_range(range, size)?;
    let mut bytes = Vec::new();
    if !head && size > 0 {
        file.seek(SeekFrom::Start(start)).ok()?;
        file.take(end - start + 1).read_to_end(&mut bytes).ok()?;
    }
    Some(Resource { bytes, mime: content_type, start, end, size, partial })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn ranges_are_bounded_and_validate_offsets() {
        assert_eq!(byte_range(Some("bytes=5-9"), 20), Some((5, 9, true)));
        assert_eq!(byte_range(Some("bytes=-5"), 20), Some((15, 19, true)));
        assert_eq!(byte_range(Some("bytes=0-"), 20_000_000), Some((0, 8 * 1024 * 1024 - 1, true)));
        for range in ["bytes=21-", "bytes=5-2", "bytes=-0", "bytes=0-1,3-4", "wrong=0-1"] { assert!(byte_range(Some(range), 20).is_none()); }
    }
    #[test] fn resources_are_read_only_and_confined() {
        let root = std::env::temp_dir().join(format!("arkamon-resource-{}", std::process::id()));
        std::fs::create_dir_all(root.join("ui")).unwrap();
        std::fs::write(root.join("ui/image test.png"), b"0123456789").unwrap();
        std::fs::write(root.join("ui/secret.txt"), b"private").unwrap();
        let resource = read_resource(&root, "/ui/image%20test.png", Some("bytes=2-5"), false).unwrap();
        assert_eq!(resource.bytes, b"2345"); assert_eq!(resource.mime, "image/png");
        assert!(read_resource(&root, "/ui/image%20test.png", None, true).unwrap().bytes.is_empty());
        for request in ["/ui/../secret.txt", "/ui/%2e%2e/secret.txt", "/ui/%5csecret.txt", "/ui/C:secret.png", "/ui/secret.txt", "/other/image.png", "/ui/%00.png"] {
            assert!(read_resource(&root, request, None, false).is_none());
        }
        std::fs::remove_dir_all(root).unwrap();
    }
}
