// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use nvml_wrapper::{enum_wrappers::nv_link::IntDeviceType::Switch, Nvml};
use souvlaki::{MediaControlEvent, MediaControls, MediaMetadata, PlatformConfig};

fn has_nvidia() -> bool {
    Nvml::init().is_ok()
}

fn main() {
    let os = std::env::consts::OS;

    if os == "linux" && has_nvidia() && std::env::var("GEKYUM_REEXEC").is_err() {
        use std::os::unix::process::CommandExt;

        let exe = std::env::current_exe().unwrap();
        let err = std::process::Command::new(exe)
            .args(std::env::args().skip(1))
            .env("GDK_BACKEND", "x11")
            .env("WEBKIT_DISABLE_DMABUF_RENDERER", "1")
            .env("GEKYUM_REEXEC", "1")
            .exec(); // substitui o processo, mesmo PID, herda tudo

        eprintln!("exec failed: {}", err);
        std::process::exit(1);
    }

    gekyum_player_lib::run()
}
