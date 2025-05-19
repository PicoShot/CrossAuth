use tauri::{
    Manager, WindowEvent,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_opener::OpenerExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            app.get_webview_window("main").map(|window| {
                let _ = window.show();
                let _ = window.set_focus();
            });
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .setup(|app| {
            let crossauth_i = MenuItem::new(app, "CrossAuth", false, None::<&str>)?;
            let update_i =
                MenuItem::with_id(app, "update", "Check for updates... ", true, None::<&str>)?;
            let report_i = MenuItem::with_id(app, "report", "Report Bug", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit CrossAuth", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(
                app,
                &[
                    &crossauth_i,
                    &separator,
                    &update_i,
                    &report_i,
                    &separator,
                    &quit_i,
                ],
            )?;
            let _tray = TrayIconBuilder::new()
                .title("CrossAuth")
                .tooltip("CrossAuth")
                .menu(&menu)
                .icon(app.default_window_icon().unwrap().clone())
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "update" => {}
                    "report" => {
                        let app = app.app_handle();
                        let url = "https://github.com/PicoShot/CrossAuth/issues";
                        app.opener().open_url(url, None::<&str>).unwrap();
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {
                        println!("menu item {:?} not handled", event.id);
                    }
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {
                        //println!("unhandled event {event:?}");
                    }
                })
                .build(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                window.hide().unwrap();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running CrossAuth application");
}
