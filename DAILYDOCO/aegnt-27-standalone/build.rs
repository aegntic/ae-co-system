//! Build script for aegnt-27 proprietary engines
//! 
//! This build script is executed during `cargo build` and sets up
//! the proprietary engine compilation system.

use std::env;
use std::path::PathBuf;

fn main() {
    println!("cargo:rerun-if-changed=build-proprietary.rs");
    println!("cargo:rerun-if-changed=src/");
    
    // Check if we're building with commercial features
    let profile = env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
    let commercial_build = env::var("AEGNT27_COMMERCIAL_BUILD").is_ok();
    
    if commercial_build {
        println!("cargo:warning=Building aegnt-27 with COMMERCIAL features enabled");
        
        // Set up proprietary build environment
        setup_proprietary_build();
        
        // Enable commercial feature flags
        println!("cargo:rustc-cfg=feature=\"commercial\"");
        println!("cargo:rustc-cfg=feature=\"proprietary\"");
        
        // Link proprietary engines if they exist
        link_proprietary_engines();
    } else {
        println!("cargo:warning=Building aegnt-27 with OPEN SOURCE features only");
        println!("cargo:warning=For commercial features, set AEGNT27_COMMERCIAL_BUILD=1");
    }
    
    // Always ensure we have the basic build setup
    ensure_basic_build_setup();
    
    println!("cargo:rustc-env=AEGNT27_BUILD_PROFILE={}", profile);
    println!("cargo:rustc-env=AEGNT27_VERSION=2.7.0");
}

fn setup_proprietary_build() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let proprietary_dir = PathBuf::from(&out_dir).join("proprietary");
    
    // Create proprietary engines directory
    std::fs::create_dir_all(&proprietary_dir).unwrap();
    
    println!("cargo:rustc-env=AEGNT27_PROPRIETARY_DIR={}", proprietary_dir.display());
}

fn link_proprietary_engines() {
    let target = env::var("TARGET").unwrap();
    let proprietary_dir = "proprietary-engines";
    
    // Check if proprietary engines exist and link them
    let engines = [
        "libaegnt27_authenticity",
        "libaegnt27_mouse", 
        "libaegnt27_typing",
        "libaegnt27_audio",
        "libaegnt27_detection",
        "libaegnt27_license"
    ];
    
    for engine in &engines {
        let lib_name = format!("{}_{}", engine, target);
        let lib_path = format!("{}/{}", proprietary_dir, lib_name);
        
        if std::path::Path::new(&lib_path).exists() {
            println!("cargo:rustc-link-lib=dylib={}", engine);
            println!("cargo:rustc-link-search=native={}", proprietary_dir);
        }
    }
}

fn ensure_basic_build_setup() {
    // Set up basic build configuration for open source version
    println!("cargo:rustc-cfg=feature=\"open_source\"");
    
    // Platform-specific setup
    let target_os = env::var("CARGO_CFG_TARGET_OS").unwrap();
    match target_os.as_str() {
        "windows" => {
            println!("cargo:rustc-link-lib=user32");
            println!("cargo:rustc-link-lib=gdi32");
        },
        "macos" => {
            println!("cargo:rustc-link-lib=framework=Cocoa");
            println!("cargo:rustc-link-lib=framework=CoreGraphics");
        },
        "linux" => {
            // Linux libraries handled by optional dependencies
        },
        _ => {}
    }
}