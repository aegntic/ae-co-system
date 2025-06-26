/// UI Components and Systems for CCTM
/// 
/// This module contains UI-related components including the persistent
/// watermark system and other visual elements.

pub mod watermark;

pub use watermark::{
    WatermarkSystem, 
    WatermarkConfig,
    get_watermark_system,
    initialize_watermark_system,
    apply_watermark_to_all_windows,
    start_watermark_monitor,
};