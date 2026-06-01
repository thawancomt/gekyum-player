// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use nvml_wrapper::Nvml;

fn has_nvidia() -> bool {
    Nvml::init().is_ok()
}

fn main() {
    // Due to DMABUF conflict between wayland and nvidia driver an
    // extra check is needed to ensure we not use DMABUF that can crash app
    let os = std::env::consts::OS;
    println!("DETECTED OS... {}", os);

    if os == "linux" {
        if has_nvidia() {
            println!("Due limitations we are disable DMABUF for NVIDIA desktops");
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    gekyum_player_lib::run()
}
