-- Create calls table
CREATE TABLE IF NOT EXISTS calls (
    call_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    first_response_time TIMESTAMP,
    answer_time TIMESTAMP,
    resolution_status ENUM('resolved', 'unresolved', 'pending') DEFAULT 'pending',
    status ENUM('completed', 'abandoned', 'unanswered', 'in_progress') DEFAULT 'in_progress',
    csat_score DECIMAL(2,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_agent_id (agent_id),
    INDEX idx_call_time (start_time)
);

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    agent_id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('active', 'inactive', 'busy', 'break') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create call_notes table for additional call information
CREATE TABLE IF NOT EXISTS call_notes (
    note_id VARCHAR(36) PRIMARY KEY,
    call_id VARCHAR(36) NOT NULL,
    agent_id VARCHAR(36) NOT NULL,
    note_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls(call_id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
);

-- Create call_tags table for categorizing calls
CREATE TABLE IF NOT EXISTS call_tags (
    tag_id VARCHAR(36) PRIMARY KEY,
    call_id VARCHAR(36) NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls(call_id) ON DELETE CASCADE
);

-- Create performance_goals table for setting agent targets
CREATE TABLE IF NOT EXISTS performance_goals (
    goal_id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(36) NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE CASCADE
); 