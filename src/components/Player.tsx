import React, { useEffect, useRef, useState } from "react";
import { List, Typography, Button, Card, InputNumber, Switch, Row, Col, Progress, Modal, message } from "antd";
import { FaPlay, FaStop, FaRedo } from "react-icons/fa";
import segments from "../data/rudra_segments.json";

const { Text, Title } = Typography;

interface Segment {
  start: number;
  end: number;
  text: string;
}

export const Player: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState<number>(0);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [enableRepeat, setEnableRepeat] = useState<boolean>(false);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [showContinueModal, setShowContinueModal] = useState<boolean>(false);
  const [hasSavedPosition, setHasSavedPosition] = useState<boolean>(false);
  const [hasShownFirstTimePrompt, setHasShownFirstTimePrompt] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load saved position on component mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
    if (savedPosition) {
      const { index, time } = JSON.parse(savedPosition);
      setCurrentIndex(index);
      setAudioTime(time);
      setHasSavedPosition(true);
    }

    // Load saved font size
    const savedFontSize = localStorage.getItem('rudraPlayer_fontSize');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }
  }, []);

  const savePosition = () => {
    if (currentIndex >= 0) {
      localStorage.setItem('rudraPlayer_lastPosition', JSON.stringify({
        index: currentIndex,
        time: audioTime
      }));
      setHasSavedPosition(true);
    }
  };

  const clearSavedPosition = () => {
    localStorage.removeItem('rudraPlayer_lastPosition');
    setHasSavedPosition(false);
    message.success('Saved position cleared');
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem('rudraPlayer_fontSize', newSize.toString());
  };

  const handlePlay = (startIndex: number = 0) => {
    // Check if this is the first time playing and there's a saved position
    if (startIndex === 0 && hasSavedPosition && !isPlaying && !hasShownFirstTimePrompt) {
      setShowContinueModal(true);
      setHasShownFirstTimePrompt(true);
      return;
    }

    setCurrentIndex(startIndex);
    setIsPlaying(true);
    setCurrentRepeat(0);
    
    // Clear saved data if starting from first line
    if (startIndex === 0) {
      clearSavedPosition();
    }
    
    savePosition();
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAudioTime(0);
    setCurrentRepeat(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleContinue = () => {
    setShowContinueModal(false);
    const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
    if (savedPosition) {
      const { index } = JSON.parse(savedPosition);
      setCurrentIndex(index);
      setIsPlaying(true);
      setCurrentRepeat(0);
      savePosition();
      message.success('Continuing from saved position');
    }
  };

  const handleStartFresh = () => {
    setShowContinueModal(false);
    clearSavedPosition();
    setCurrentIndex(0);
    setIsPlaying(true);
    setCurrentRepeat(0);
    savePosition();
    message.success('Starting fresh');
  };

  const handleSegmentClick = (index: number) => {
    if (isPlaying) {
      handleStop();
    }
    handlePlay(index);
  };

  const handlePlayButton = () => {
    // Try to continue from saved position first
    if (hasSavedPosition && !isPlaying) {
      const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
      if (savedPosition) {
        const { index } = JSON.parse(savedPosition);
        handlePlay(index);
        message.success('Continuing from saved position');
        return;
      }
    }
    
    // If no saved position or already shown prompt, start from first
    if (hasSavedPosition && !isPlaying && !hasShownFirstTimePrompt) {
      setShowContinueModal(true);
      setHasShownFirstTimePrompt(true);
    } else {
      handlePlay(0);
    }
  };

  const handleRefreshButton = () => {
    handlePlay(0);
  };

  const getCurrentSegmentProgress = () => {
    if (currentIndex >= 0 && currentIndex < segments.length) {
      const { start, end } = segments[currentIndex];
      const progress = ((audioTime - start) / (end - start)) * 100;
      return Math.max(0, Math.min(100, progress));
    }
    return 0;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Auto-scroll to current segment
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && segmentRefs.current[currentIndex]) {
      const currentElement = segmentRefs.current[currentIndex];
      const container = scrollContainerRef.current;
      
      if (currentElement && container) {
        const elementRect = currentElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Check if element is not fully visible
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          currentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < segments.length) {
      const { start, end } = segments[currentIndex];
      
      if (audioRef.current) {
        audioRef.current.currentTime = start;
        audioRef.current.play();
      }

      // Set up interval to check audio time and advance segments
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime;
          setAudioTime(currentTime);
          savePosition(); // Save position every 100ms

          // Check if we need to advance to next segment
          if (currentTime >= end) {
            if (enableRepeat && currentRepeat < repeatCount - 1) {
              // Repeat current segment
              setCurrentRepeat(currentRepeat + 1);
              if (audioRef.current) {
                audioRef.current.currentTime = start;
                audioRef.current.play();
              }
            } else if (currentIndex + 1 < segments.length) {
              // Move to next segment
              setCurrentIndex(currentIndex + 1);
              setCurrentRepeat(0);
            } else {
              // End of all segments - clear saved data
              clearSavedPosition();
              handleStop();
            }
          }
        }
      }, 100); // Check every 100ms
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, isPlaying, currentRepeat, enableRepeat, repeatCount]);

  const visibleSegments = segments.map((segment: Segment, index: number) => {
    const isActive = index === currentIndex;
    const isCompleted = index < currentIndex;
    
    // Check if this segment is the saved position when not playing
    const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
    let savedIndex = -1;
    if (savedPosition && !isPlaying) {
      try {
        const { index: savedIdx } = JSON.parse(savedPosition);
        savedIndex = savedIdx;
      } catch {
        // Handle parsing error
      }
    }
    const isSavedPosition = index === savedIndex && !isPlaying;

    return {
      ...segment,
      label: (
        <div 
          ref={(el) => {
            segmentRefs.current[index] = el;
          }}
          className="segment-item"
          style={{ 
            cursor: 'pointer',
            padding: '16px 12px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            backgroundColor: isActive ? '#e6f7ff' : isCompleted ? '#f6ffed' : isSavedPosition ? '#e6f7ff' : 'transparent',
            border: isActive ? '2px solid #1890ff' : isSavedPosition ? '2px solid #1890ff' : '2px solid transparent',
            margin: '6px 8px',
            boxShadow: isActive ? '0 4px 12px rgba(24, 144, 255, 0.15)' : isSavedPosition ? '0 4px 12px rgba(24, 144, 255, 0.15)' : 'none',
          }}
          onClick={() => handleSegmentClick(index)}
          onMouseEnter={(e) => {
            if (!isActive && !isSavedPosition) {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive && !isSavedPosition) {
              e.currentTarget.style.backgroundColor = isCompleted ? '#f6ffed' : 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {isActive && (
                <div style={{ marginRight: '12px' }}>
                  <Progress 
                    type="circle" 
                    percent={getCurrentSegmentProgress()} 
                    size={30}
                    strokeColor="#1890ff"
                    format={() => null}
                    strokeWidth={3}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <Text 
                  strong={isActive || isSavedPosition} 
                  style={{ 
                    color: isActive ? "#1890ff" : isCompleted ? "#52c41a" : isSavedPosition ? "#1890ff" : "#333",
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.8',
                    fontFamily: 'Noto Sans Devanagari, Arial, sans-serif',
                    fontWeight: isActive || isSavedPosition ? 600 : 400,
                    letterSpacing: '0.5px'
                  }}
                >
                  {isActive ? "" : isCompleted ? "" : isSavedPosition ? "💾 " : ""}
                  {segment.text}
                </Text>
                {isActive && enableRepeat && repeatCount > 1 && (
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                      Repeat {currentRepeat + 1}/{repeatCount}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    };
  });

  return (
    <div style={{ 
      width: '99vw', 
      boxSizing: 'border-box',
      backgroundColor: '#ffffff'
    }}
    className="main-container"
    >
      <Card style={{ 
        height: '100%',
        borderRadius: '16px', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ marginBottom: 24 }}>
          <style>{`
            @media (max-width: 767px) {
              .desktop-header { display: none !important; }
              .mobile-header { display: block !important; }
              .main-container {
                padding: 4px !important;
              }
              .scroll-container {
                padding: 16px 0 !important;
              }
              .segment-item {
                padding: 16px 8px !important;
                margin: 6px 0 !important;
                border-radius: 0 !important;
              }
            }
            @media (min-width: 768px) {
              .mobile-header { display: none !important; }
              .desktop-header { display: block !important; }
              .segment-item {
                padding: 16px 20px !important;
                margin: 6px 8px !important;
                border-radius: 12px !important;
              }
            }
          `}</style>
          
          {/* Mobile Header - Stacked Layout */}
          <div className="mobile-header" style={{ display: 'none' }}>
            <Title level={1} style={{ 
              textAlign: 'center', 
              marginBottom: 8, 
              color: '#1890ff',
              fontSize: 'clamp(18px, 6vw, 24px)',
              fontWeight: 700,
              letterSpacing: '0.5px',
              padding: '0 8px',
              lineHeight: '1.3'
            }}>
              📖 Rudrapath Line-by-Line Player
            </Title>
            
            {/* Created By section for mobile */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 12,
              padding: '0 8px'
            }}>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#d32f2f',
                display: 'block',
                lineHeight: '1.2'
              }}>
                Created By
              </Text>
              <Text style={{ 
                fontSize: '12px', 
                fontWeight: 600, 
                color: '#d32f2f',
                display: 'block',
                lineHeight: '1.2'
              }}>
                Rohit Sopan Mahajan
              </Text>
            </div>
            
            {/* Mobile Status Bar */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '0 8px'
            }}>
              {isPlaying && (
                <div style={{ 
                  padding: '6px 10px', 
                  backgroundColor: '#f0f8ff', 
                  borderRadius: '6px',
                  border: '2px solid #d6e4ff',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
                    {formatTime(audioTime)}
                  </Text>
                  {currentIndex >= 0 && (
                    <Text type="secondary" style={{ marginLeft: 4, fontSize: '10px' }}>
                      ({currentIndex + 1}/{segments.length})
                    </Text>
                  )}
                </div>
              )}
              {hasSavedPosition && !isPlaying && (
                <Button 
                  size="small"
                  onClick={clearSavedPosition}
                  style={{ 
                    fontSize: '9px',
                    height: '28px',
                    padding: '0 8px',
                    backgroundColor: '#ff7875',
                    borderColor: '#ff7875',
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Header - Horizontal Layout */}
          <div className="desktop-header" style={{ display: 'none' }}>
            <Title level={1} style={{ 
              textAlign: 'center', 
              marginBottom: 0, 
              color: '#1890ff',
              fontSize: 'clamp(24px, 4vw, 32px)',
              fontWeight: 700,
              letterSpacing: '1px',
              padding: '0 16px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%',
                minHeight: '48px'
              }}>
                <div style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#d32f2f',
                  textAlign: 'left',
                  lineHeight: '1.3'
                }}>
                  <div>Created By</div>
                  <div>Rohit Sopan Mahajan</div>
                </div>
                <div style={{ flex: 2, textAlign: 'center' }}>
                  📖 Rudrapath Line-by-Line Player Learning
                </div>
                <div style={{ flex: 1, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  {isPlaying && (
                    <div style={{ 
                      padding: '4px 12px', 
                      backgroundColor: '#f0f8ff', 
                      borderRadius: '6px',
                      border: '2px solid #d6e4ff',
                      textAlign: 'center',
                      minWidth: '120px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
                        Total: {formatTime(audioTime)}
                      </Text>
                      {currentIndex >= 0 && (
                        <Text type="secondary" style={{ marginLeft: 6, fontSize: '11px' }}>
                          {currentIndex + 1}/{segments.length}
                        </Text>
                      )}
                    </div>
                  )}
                  {hasSavedPosition && !isPlaying && (
                    <Button 
                      size="small"
                      onClick={clearSavedPosition}
                      style={{ 
                        fontSize: '10px',
                        height: '24px',
                        padding: '0 6px',
                        backgroundColor: '#ff7875',
                        borderColor: '#ff7875',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: 500
                      }}
                    >
                      Clear Saved Data
                    </Button>
                  )}
                </div>
              </div>
            </Title>
          </div>
        </div>

        <Row gutter={[12, 12]} style={{ marginBottom: 20, padding: '0 8px' }}>
          <Col xs={24} sm={24} md={8}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <Button 
                type="primary" 
                size="large"
                icon={<FaPlay />}
                onClick={handlePlayButton} 
                disabled={isPlaying}
                style={{ 
                  height: '48px', 
                  width: '48px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
              <Button 
                size="large"
                icon={<FaStop />}
                onClick={handleStop} 
                disabled={!isPlaying}
                style={{ 
                  height: '48px', 
                  width: '48px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
              <Button 
                size="large"
                icon={<FaRedo />}
                onClick={handleRefreshButton}
                disabled={isPlaying}
                style={{ 
                  height: '48px', 
                  width: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#52c41a',
                  borderColor: '#52c41a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </div>
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              minHeight: '40px'
            }}>
              <Text strong style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Repeat:</Text>
              <Switch 
                checked={enableRepeat}
                onChange={setEnableRepeat}
                size="small"
              />
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                minWidth: '80px',
                justifyContent: 'center',
                height: '32px'
              }}>
                {enableRepeat && (
                  <InputNumber
                    min={1}
                    max={10}
                    value={repeatCount}
                    onChange={(value) => setRepeatCount(value || 1)}
                    style={{ width: '80px', height: '32px' }}
                    size="small"
                  />
                )}
              </div>
            </div>
          </Col>

          <Col xs={24} sm={24} md={8}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              minHeight: '40px'
            }}>
              <Text strong style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Font Size:</Text>
              <Button 
                size="small"
                onClick={() => handleFontSizeChange(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
                style={{ 
                  height: '28px', 
                  width: '28px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                A-
              </Button>
              <Text style={{ fontSize: '12px', minWidth: '30px', textAlign: 'center' }}>
                {fontSize}px
              </Text>
              <Button 
                size="small"
                onClick={() => handleFontSizeChange(Math.min(32, fontSize + 2))}
                disabled={fontSize >= 32}
                style={{ 
                  height: '28px', 
                  width: '28px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                A+
              </Button>
            </div>
          </Col>
        </Row>

        <div 
          ref={scrollContainerRef}
          style={{ 
            flex: 1,
            overflowY: 'auto',
            border: '2px solid #e8e8e8',
            borderRadius: '16px',
            padding: '16px 0',
            backgroundColor: '#fafafa',
            maxHeight: 'calc(100vh - 200px)',
            minHeight: '400px'
          }}
          className="scroll-container"
        >
          <List
            size="large"
            dataSource={visibleSegments}
            renderItem={(item) => <List.Item style={{ padding: 0, border: 'none' }}>{item.label}</List.Item>}
            style={{ margin: 0 }}
          />
        </div>

        <audio
          ref={audioRef}
          src="/rudra.mp3"
          preload="auto"
          onEnded={handleStop}
          style={{ display: 'none' }}
        />

        <Modal
          title="Continue from where you left off?"
          open={showContinueModal}
          onOk={handleContinue}
          onCancel={handleStartFresh}
          okText="Continue"
          cancelText="Start Fresh"
          centered
        >
          <p>We found your last played position. Would you like to continue from where you left off or start fresh?</p>
        </Modal>
      </Card>
    </div>
  );
};