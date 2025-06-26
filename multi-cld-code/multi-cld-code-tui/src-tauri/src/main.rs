/// CCTM TUI - Claude Code Terminal Manager Terminal User Interface
/// 
/// A blazing-fast TUI for managing Claude Code sessions with AI-powered 
/// terminal orchestration and MCP integration.

use std::io;
use color_eyre::eyre::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEvent, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::{Backend, CrosstermBackend},
    layout::{Alignment, Constraint, Direction, Layout, Rect},
    style::{Color, Modifier, Style},
    symbols,
    text::{Line, Span, Text},
    widgets::{
        Block, BorderType, Borders, Cell, Clear, Gauge, List, ListItem, ListState, Paragraph, Row,
        Table, Tabs, Wrap,
    },
    Frame, Terminal,
};

mod cctm;
use cctm::{CctmApp, CctmState};

fn main() -> Result<()> {
    color_eyre::install()?;
    
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    // Create and run app
    let mut app = CctmApp::new();
    let res = run_app(&mut terminal, &mut app);

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{err:?}");
    }

    Ok(())
}

fn run_app<B: Backend>(terminal: &mut Terminal<B>, app: &mut CctmApp) -> Result<()> {
    loop {
        terminal.draw(|f| ui(f, app))?;

        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                match handle_key_event(key, app) {
                    Ok(should_quit) => {
                        if should_quit {
                            return Ok(());
                        }
                    }
                    Err(err) => {
                        app.set_error(format!("Error: {}", err));
                    }
                }
            }
        }
    }
}

fn handle_key_event(key: KeyEvent, app: &mut CctmApp) -> Result<bool> {
    match key.code {
        KeyCode::Char('q') => return Ok(true),
        KeyCode::Char('c') if key.modifiers.contains(crossterm::event::KeyModifiers::CONTROL) => {
            return Ok(true);
        }
        KeyCode::Tab => {
            app.next_tab();
        }
        KeyCode::BackTab => {
            app.previous_tab();
        }
        KeyCode::Char('n') if key.modifiers.contains(crossterm::event::KeyModifiers::CONTROL) => {
            app.spawn_new_terminal()?;
        }
        KeyCode::Char('w') if key.modifiers.contains(crossterm::event::KeyModifiers::CONTROL) => {
            app.close_current_terminal()?;
        }
        KeyCode::Up => {
            app.scroll_up();
        }
        KeyCode::Down => {
            app.scroll_down();
        }
        KeyCode::Enter => {
            if app.get_current_state() == CctmState::TerminalList {
                app.enter_terminal()?;
            } else if app.get_current_state() == CctmState::AiInput {
                app.execute_ai_command()?;
            }
        }
        KeyCode::Char('/') => {
            app.enter_ai_mode();
        }
        KeyCode::Esc => {
            app.exit_current_mode();
        }
        KeyCode::Char(c) => {
            if app.get_current_state() == CctmState::AiInput {
                app.add_to_ai_input(c);
            }
        }
        KeyCode::Backspace => {
            if app.get_current_state() == CctmState::AiInput {
                app.backspace_ai_input();
            }
        }
        _ => {}
    }
    Ok(false)
}

fn ui(f: &mut Frame, app: &mut CctmApp) {
    let size = f.size();
    
    // Create main layout
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),  // Header
            Constraint::Min(0),     // Main content
            Constraint::Length(3),  // Footer/Status
        ])
        .split(size);

    // Render header with watermark
    render_header(f, chunks[0], app);
    
    // Render main content based on current tab
    match app.get_current_tab() {
        0 => render_terminal_view(f, chunks[1], app),
        1 => render_ai_view(f, chunks[1], app),
        2 => render_mcp_view(f, chunks[1], app),
        3 => render_project_view(f, chunks[1], app),
        _ => render_terminal_view(f, chunks[1], app),
    }
    
    // Render footer
    render_footer(f, chunks[2], app);
    
    // Render modal dialogs if any
    if let Some(error) = app.get_error() {
        render_error_popup(f, size, error);
    }
}

fn render_header(f: &mut Frame, area: Rect, app: &mut CctmApp) {
    let titles: Vec<Line> = vec!["Terminals", "AI Assistant", "MCP Tools", "Projects"]
        .iter()
        .cloned()
        .map(Line::from)
        .collect();
    
    let tabs = Tabs::new(titles)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" {ae} CCTM TUI | aegntic.ai ")
                .title_alignment(Alignment::Center)
                .style(Style::default().fg(Color::Cyan))
        )
        .style(Style::default().fg(Color::White))
        .highlight_style(Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))
        .select(app.get_current_tab());
    
    f.render_widget(tabs, area);
}

fn render_terminal_view(f: &mut Frame, area: Rect, app: &mut CctmApp) {
    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(30), Constraint::Percentage(70)])
        .split(area);

    // Terminal list on the left
    let terminals = app.get_terminals()
        .iter()
        .map(|t| {
            ListItem::new(Line::from(vec![
                Span::styled(
                    format!("[{}] ", t.id),
                    Style::default().fg(Color::Yellow)
                ),
                Span::styled(
                    t.title.clone(),
                    Style::default().fg(Color::White)
                ),
                Span::styled(
                    format!(" ({})", t.status),
                    Style::default().fg(match t.status.as_str() {
                        "Running" => Color::Green,
                        "Stopped" => Color::Red,
                        _ => Color::Gray,
                    })
                ),
            ]))
        })
        .collect::<Vec<_>>();

    let terminals_list = List::new(terminals)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" Terminal Sessions ")
                .title_alignment(Alignment::Left)
        )
        .highlight_style(Style::default().bg(Color::DarkGray).add_modifier(Modifier::BOLD))
        .highlight_symbol("► ");

    let mut state = ListState::default();
    state.select(Some(app.get_selected_terminal()));
    f.render_stateful_widget(terminals_list, chunks[0], &mut state);

    // Terminal output on the right
    let current_terminal = app.get_current_terminal();
    let output_text = if let Some(terminal) = current_terminal {
        Text::from(terminal.output.clone())
    } else {
        Text::from("No terminal selected\n\nPress Ctrl+N to create a new terminal")
    };

    let output_block = Paragraph::new(output_text)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" Terminal Output ")
                .title_alignment(Alignment::Left)
        )
        .wrap(Wrap { trim: true })
        .scroll((app.get_scroll_offset(), 0));

    f.render_widget(output_block, chunks[1]);
}

fn render_ai_view(f: &mut Frame, area: Rect, app: &mut CctmApp) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(5),     // Chat history
            Constraint::Length(3),  // Input box
        ])
        .split(area);

    // AI chat history
    let messages = app.get_ai_messages()
        .iter()
        .flat_map(|msg| {
            vec![
                Line::from(vec![
                    Span::styled(
                        format!("[{}] ", msg.timestamp),
                        Style::default().fg(Color::DarkGray)
                    ),
                    Span::styled(
                        if msg.is_user { "You" } else { "AE Assistant" },
                        Style::default().fg(if msg.is_user { Color::Cyan } else { Color::Green }).add_modifier(Modifier::BOLD)
                    ),
                    Span::styled(": ", Style::default().fg(Color::White)),
                ]),
                Line::from(msg.content.clone()),
                Line::from(""),
            ]
        })
        .collect::<Vec<_>>();

    let chat_history = Paragraph::new(messages)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" AI Conversation ")
                .title_alignment(Alignment::Left)
        )
        .wrap(Wrap { trim: true });

    f.render_widget(chat_history, chunks[0]);

    // AI input box
    let input_style = if app.get_current_state() == CctmState::AiInput {
        Style::default().fg(Color::Yellow)
    } else {
        Style::default().fg(Color::White)
    };

    let input_block = Paragraph::new(app.get_ai_input())
        .style(input_style)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(if app.get_current_state() == CctmState::AiInput {
                    " AE Command (Press Enter to execute, Esc to cancel) "
                } else {
                    " Press '/' to start AE command "
                })
                .title_alignment(Alignment::Left)
        );

    f.render_widget(input_block, chunks[1]);

    // Show cursor in input mode
    if app.get_current_state() == CctmState::AiInput {
        let cursor_x = chunks[1].x + app.get_ai_input().len() as u16 + 1;
        let cursor_y = chunks[1].y + 1;
        f.set_cursor(cursor_x, cursor_y);
    }
}

fn render_mcp_view(f: &mut Frame, area: Rect, app: &mut CctmApp) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage(60),  // MCP servers list
            Constraint::Percentage(40),  // MCP capabilities
        ])
        .split(area);

    // MCP servers
    let servers = app.get_mcp_servers()
        .iter()
        .map(|server| {
            Row::new(vec![
                Cell::from(server.name.clone()),
                Cell::from(server.status.clone()).style(Style::default().fg(match server.status.as_str() {
                    "Running" => Color::Green,
                    "Stopped" => Color::Red,
                    "Starting" => Color::Yellow,
                    _ => Color::Gray,
                })),
                Cell::from(server.capabilities.len().to_string()),
                Cell::from(format!("{}MB", server.memory_usage)),
            ])
        })
        .collect::<Vec<_>>();

    let servers_table = Table::new(
        servers,
        [
            Constraint::Percentage(40),
            Constraint::Percentage(20),
            Constraint::Percentage(20),
            Constraint::Percentage(20),
        ]
    )
    .header(
        Row::new(vec!["Server", "Status", "Tools", "Memory"])
            .style(Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))
    )
    .block(
        Block::default()
            .borders(Borders::ALL)
            .border_type(BorderType::Rounded)
            .title(" MCP Servers ")
            .title_alignment(Alignment::Left)
    );

    f.render_widget(servers_table, chunks[0]);

    // MCP capabilities
    let capabilities_text = app.get_mcp_servers()
        .iter()
        .flat_map(|server| {
            let mut lines = vec![
                Line::from(vec![
                    Span::styled(
                        format!("{}:", server.name),
                        Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)
                    ),
                ]),
            ];
            for cap in &server.capabilities {
                lines.push(Line::from(format!("  • {}: {}", cap.name, cap.description)));
            }
            lines.push(Line::from(""));
            lines
        })
        .collect::<Vec<_>>();

    let capabilities_block = Paragraph::new(capabilities_text)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" Available Tools ")
                .title_alignment(Alignment::Left)
        )
        .wrap(Wrap { trim: true });

    f.render_widget(capabilities_block, chunks[1]);
}

fn render_project_view(f: &mut Frame, area: Rect, app: &mut CctmApp) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(5),   // Project info
            Constraint::Min(0),      // Project files/structure
        ])
        .split(area);

    // Project info
    let project_info = if let Some(project) = app.get_current_project() {
        vec![
            Line::from(vec![
                Span::styled("Project: ", Style::default().fg(Color::Yellow)),
                Span::styled(project.name.clone(), Style::default().fg(Color::White).add_modifier(Modifier::BOLD)),
            ]),
            Line::from(vec![
                Span::styled("Type: ", Style::default().fg(Color::Yellow)),
                Span::styled(project.project_type.clone(), Style::default().fg(Color::Green)),
            ]),
            Line::from(vec![
                Span::styled("Path: ", Style::default().fg(Color::Yellow)),
                Span::styled(project.path.clone(), Style::default().fg(Color::Cyan)),
            ]),
        ]
    } else {
        vec![
            Line::from("No project detected"),
            Line::from(""),
            Line::from("Open a directory with project files to see project information"),
        ]
    };

    let project_info_block = Paragraph::new(project_info)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" Current Project ")
                .title_alignment(Alignment::Left)
        );

    f.render_widget(project_info_block, chunks[0]);

    // Project structure placeholder
    let structure_text = vec![
        Line::from("Project Structure:"),
        Line::from(""),
        Line::from("📁 src/"),
        Line::from("  📄 main.rs"),
        Line::from("  📄 lib.rs"),
        Line::from("📄 Cargo.toml"),
        Line::from("📄 README.md"),
        Line::from(""),
        Line::from("(Project structure detection coming soon)"),
    ];

    let structure_block = Paragraph::new(structure_text)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" Project Structure ")
                .title_alignment(Alignment::Left)
        );

    f.render_widget(structure_block, chunks[1]);
}

fn render_footer(f: &mut Frame, area: Rect, app: &mut CctmApp) {
    let help_text = match app.get_current_state() {
        CctmState::TerminalList => {
            "Tab: Switch tabs | ↑↓: Navigate | Enter: Open terminal | Ctrl+N: New | Ctrl+W: Close | /: AI mode | Q: Quit"
        }
        CctmState::AiInput => {
            "Type your AE command | Enter: Execute | Esc: Cancel"
        }
        _ => {
            "Tab: Switch tabs | ↑↓: Navigate | /: AI mode | Q: Quit"
        }
    };

    let help_paragraph = Paragraph::new(help_text)
        .style(Style::default().fg(Color::DarkGray))
        .alignment(Alignment::Center)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .style(Style::default().fg(Color::DarkGray))
        );

    f.render_widget(help_paragraph, area);
}

fn render_error_popup(f: &mut Frame, area: Rect, error: &str) {
    let popup_area = centered_rect(60, 20, area);
    
    f.render_widget(Clear, popup_area);
    
    let error_block = Paragraph::new(error)
        .style(Style::default().fg(Color::Red))
        .alignment(Alignment::Center)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_type(BorderType::Rounded)
                .title(" Error ")
                .title_alignment(Alignment::Center)
                .style(Style::default().fg(Color::Red))
        )
        .wrap(Wrap { trim: true });

    f.render_widget(error_block, popup_area);
}

fn centered_rect(percent_x: u16, percent_y: u16, r: Rect) -> Rect {
    let popup_layout = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(r);

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(popup_layout[1])[1]
}
