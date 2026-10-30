mod resource_files;
use std::borrow::Cow;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let resources = app.path().resource_dir()?.join("assets");
            let config = app.config().app.windows.first().expect("main window configuration");
            tauri::WebviewWindowBuilder::from_config(app, config)?
                .on_web_resource_request(move |request, response| {
                    // Only the app's own Tauri protocol reaches this callback;
                    // network URLs and the development server are untouched.
                    if request.method() != "GET" && request.method() != "HEAD" { return; }
                    let range = request.headers().get("range").and_then(|value| value.to_str().ok());
                    if let Some(file) = resource_files::read_resource(&resources, request.uri().path(), range, request.method() == "HEAD") {
                        let mut replacement = tauri::http::Response::builder()
                            .status(if file.partial { 206 } else { 200 })
                            .header("Content-Type", file.mime)
                            .header("X-Content-Type-Options", "nosniff")
                            .header("Accept-Ranges", "bytes")
                            .header("Cache-Control", "no-cache");
                        if file.partial { replacement = replacement.header("Content-Range", format!("bytes {}-{}/{}", file.start, file.end, file.size)); }
                        replacement = replacement.header("Content-Length", if file.size == 0 { 0 } else { file.end - file.start + 1 });
                        if let Ok(built) = replacement.body(Cow::Owned(file.bytes)) { *response = built; }
                    }
                }).build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
