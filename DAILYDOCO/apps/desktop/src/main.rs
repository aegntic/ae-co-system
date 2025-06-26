/*!
 * DailyDoco Pro Desktop Application
 * 
 * Elite-tier automated documentation platform with integrated aegnt-27
 */

use aegnt_27::prelude::*;
use std::error::Error;

mod capture;
mod ui;
mod config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    env_logger::init();
    
    // Initialize aegnt-27 system
    // let aegnt_config = AegntConfig::default();
    // aegnt_27::init_with_config(aegnt_config).await?;
    aegnt_27::init().await?;
    
    log::info!("🎬 DailyDoco Pro Desktop v{} starting...", env!("CARGO_PKG_VERSION"));
    log::info!("🧠 aegnt-27 integrated and ready");
    
    // Start desktop application
    log::info!("📱 Desktop application ready");
    
    Ok(())
}