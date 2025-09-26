import React, { useState, useEffect, useRef } from 'react';

// Système de thèmes intégré
const themes = {
  default: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#f59e0b',
      success: '#22c55e',
      error: '#ef4444',
      background: '#111827',
      surface: '#1f2937',
      surfaceLight: '#374151',
      text: '#ffffff',
      textMuted: '#9ca3af'
    },
    gradients: {
      main: 'radial-gradient(circle at center, #1e40af 0%, #0f172a 100%)',
      surface: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
      primary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      accent: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    }
  },
  cyberpunk: {
    colors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      success: '#00ff00',
      error: '#ff0040',
      background: '#000011',
      surface: '#001122',
      surfaceLight: '#002244',
      text: '#00ffaa',
      textMuted: '#0088aa'
    },
    gradients: {
      main: 'radial-gradient(circle at center, #00ffff 0%, #000011 100%)',
      surface: 'linear-gradient(135deg, #001122 0%, #000011 100%)',
      primary: 'linear-gradient(135deg, #00ffff 0%, #0088ff 100%)',
      accent: 'linear-gradient(135deg, #ff00ff 0%, #aa00aa 100%)'
    }
  },
  analog: {
    colors: {
      primary: '#d4712b',
      secondary: '#8b4513',
      success: '#228b22',
      error: '#dc143c',
      background: '#2f1b14',
      surface: '#4a2c20',
      surfaceLight: '#6b3e2f',
      text: '#f4e4bc',
      textMuted: '#d4c4a8'
    },
    gradients: {
      main: 'radial-gradient(circle at center, #d4712b 0%, #2f1b14 100%)',
      surface: 'linear-gradient(135deg, #4a2c20 0%, #2f1b14 100%)',
      primary: 'linear-gradient(135deg, #d4712b 0%, #b8611f 100%)',
      accent: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)'
    }
  }
};

// Hook pour la gestion des thèmes
const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState('default');
  return {
    theme: themes[currentTheme],
    setTheme: setCurrentTheme,
    currentTheme
  };
};

// Composant pour contrôles MIDI tactiles optimisés
const MidiValueControl = ({ label, value, min, max, onChange, theme }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  
  const longPressRef = useRef(null);
  const controlRef = useRef(null);
  
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleLongPress = () => {
    if (!isDragging) {
      setShowWheel(true);
      // Vibration tactile si supportée
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setStartY(touch.clientY);
    setStartValue(value);
    setIsDragging(false);
    
    // Démarrer le timer pour long press
    longPressRef.current = setTimeout(handleLongPress, 500);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = startY - touch.clientY; // Inversé : swipe up = positif
    const sensitivity = 2; // pixels par unité
    
    if (Math.abs(deltaY) > 10) {
      setIsDragging(true);
      // Annuler le long press si on commence à drag
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
        longPressRef.current = null;
      }
      
      const increment = Math.round(deltaY / sensitivity);
      const newValue = Math.max(min, Math.min(max, startValue + increment));
      
      if (newValue !== value) {
        onChange(newValue);
        // Vibration subtile pour le feedback
        if (navigator.vibrate && Math.abs(increment) > 0) {
          navigator.vibrate(10);
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    
    // Nettoyer le timer long press
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    
    // Si c'était juste un tap (pas de drag), activer l'édition directe
    if (!isDragging) {
      setIsEditing(true);
      setTempValue(value);
    }
    
    setIsDragging(false);
  };

  const handleDirectEdit = (newValue) => {
    const parsed = parseInt(newValue) || min;
    const clamped = Math.max(min, Math.min(max, parsed));
    setTempValue(clamped);
  };

  const confirmEdit = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const generateWheelValues = () => {
    const values = [];
    const step = label === 'CC' ? 1 : label === 'CH' ? 1 : label === 'MIN' || label === 'MAX' ? 10 : 1;
    for (let i = min; i <= max; i += step) {
      values.push(i);
    }
    return values;
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', position: 'relative' }}>
        <label style={{ 
          fontSize: '0.65rem', 
          color: theme.colors.textMuted,
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {label}
        </label>
        
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <input
              type="number"
              min={min}
              max={max}
              value={tempValue}
              onChange={(e) => handleDirectEdit(e.target.value)}
              onBlur={confirmEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
              autoFocus
              style={{
                backgroundColor: `${theme.colors.primary}30`,
                border: `2px solid ${theme.colors.primary}`,
                borderRadius: '0.375rem',
                padding: '0.4rem 0.2rem',
                color: theme.colors.text,
                fontSize: '0.75rem',
                textAlign: 'center',
                fontWeight: 'bold',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={confirmEdit}
                style={{
                  flex: 1,
                  padding: '0.2rem',
                  backgroundColor: theme.colors.success,
                  border: 'none',
                  borderRadius: '0.2rem',
                  color: 'white',
                  fontSize: '0.6rem',
                  cursor: 'pointer'
                }}
              >
                ✓
              </button>
              <button
                onClick={cancelEdit}
                style={{
                  flex: 1,
                  padding: '0.2rem',
                  backgroundColor: theme.colors.error,
                  border: 'none',
                  borderRadius: '0.2rem',
                  color: 'white',
                  fontSize: '0.6rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={controlRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsEditing(true)}
            style={{
              backgroundColor: isDragging 
                ? `${theme.colors.secondary}30` 
                : `${theme.colors.surfaceLight}80`,
              border: isDragging 
                ? `2px solid ${theme.colors.secondary}` 
                : `1px solid ${theme.colors.surfaceLight}`,
              borderRadius: '0.375rem',
              padding: '0.4rem 0.2rem',
              color: theme.colors.text,
              fontSize: '0.75rem',
              textAlign: 'center',
              fontWeight: 'bold',
              cursor: 'pointer',
              userSelect: 'none',
              touchAction: 'none',
              transition: 'all 0.15s ease',
              position: 'relative',
              minHeight: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span style={{ 
              color: isDragging ? theme.colors.secondary : theme.colors.text,
              transition: 'color 0.15s ease'
            }}>
              {value}
            </span>
            
            {/* Indicateurs visuels pour les gestes */}
            {!isEditing && (
              <div style={{
                position: 'absolute',
                right: '2px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.5rem',
                color: theme.colors.textMuted,
                opacity: 0.6,
                display: 'flex',
                flexDirection: 'column',
                lineHeight: '0.7'
              }}>
                <span>↑</span>
                <span>↓</span>
              </div>
            )}
          </div>
        )}
        

      </div>

      {/* Popup Wheel Selector */}
      {showWheel && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '1rem',
            padding: '1.5rem',
            border: `2px solid ${theme.colors.primary}`,
            minWidth: '250px',
            maxHeight: '60vh',
            overflow: 'hidden'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: theme.colors.text
            }}>
              🎛️ Sélectionner {label}
            </div>
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
              gap: '0.5rem',
              padding: '0.5rem'
            }}>
              {generateWheelValues().map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    onChange(val);
                    setShowWheel(false);
                    if (navigator.vibrate) navigator.vibrate(30);
                  }}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: val === value 
                      ? `2px solid ${theme.colors.primary}` 
                      : `1px solid ${theme.colors.surfaceLight}`,
                    backgroundColor: val === value 
                      ? `${theme.colors.primary}30` 
                      : theme.colors.surfaceLight,
                    color: val === value 
                      ? theme.colors.primary 
                      : theme.colors.text,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: val === value ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowWheel(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                backgroundColor: theme.colors.surfaceLight,
                border: 'none',
                borderRadius: '0.5rem',
                color: theme.colors.text,
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Utilitaire de throttle pour optimiser les performances
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Composant Menu Simple
const SimpleMenu = ({ visible, activeSection, onSectionChange, onClose, theme, debugInfo, setDebugInfo, oscConfig, setOscConfig, currentTheme, setTheme }) => {
  // Afficher le composant si le menu est visible OU si une section est active
  if (!visible && !activeSection) return null;

  const menuItems = [
    { id: 'settings', label: 'Paramètres' },
    { id: 'themes', label: 'Thèmes' },
    { id: 'debug', label: 'Debug' },
    { id: 'info', label: 'Info' }
  ];

  const handleSectionChange = (section) => {
    onSectionChange(section);
    // Ne pas fermer le menu, juste changer de section
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (activeSection) {
        // Fermer le sous-menu et revenir au menu principal
        onSectionChange(null);
      } else {
        // Fermer complètement le menu
        onClose();
      }
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: activeSection ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.4)',
        backdropFilter: activeSection ? 'blur(20px)' : 'blur(8px)',
        zIndex: 300,
        animation: 'fadeIn 0.3s ease-out'
      }}
      onClick={handleBackdropClick}
    >
      {/* Menu principal (seulement visible si pas de section active) */}
      {visible && !activeSection && (
        <div style={{
          position: 'absolute',
          top: '5rem',
          right: '2rem',
          minWidth: '200px',
          backgroundColor: theme.colors.surface,
          borderRadius: '0.75rem',
          padding: '0.5rem 0',
          border: `1px solid ${theme.colors.surfaceLight}`,
          boxShadow: `0 10px 40px ${theme.colors.background}80`,
          backdropFilter: 'blur(20px)',
          animation: 'slideDown 0.3s ease-out',
          transform: 'translateY(0) scale(1)',
          opacity: 1
        }}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              style={{
                padding: '0.75rem 1.25rem',
                color: theme.colors.text,
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '400',
                backgroundColor: 'transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = `${theme.colors.surfaceLight}30`;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}

      {/* Sous-menu plein écran */}
      {activeSection && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.surface,
          padding: 0, // Suppression du padding général
          overflowY: 'auto',
          animation: 'slideInLeft 0.4s ease-out'
        }}>
          {/* Bouton de fermeture */}
          <button
            onClick={() => onSectionChange(null)}
            style={{
              position: 'fixed', // Changé en fixed pour être vraiment au-dessus
              top: '2rem',
              right: '2rem',
              width: '2.5rem',
              height: '2.5rem',
              border: 'none',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              color: theme.colors.textMuted,
              cursor: 'pointer',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              zIndex: 1000 // Z-index très élevé
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = `${theme.colors.error}20`;
              e.target.style.color = theme.colors.error;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
              e.target.style.color = theme.colors.textMuted;
            }}
            title="Fermer"
          >
            ✕
          </button>

          {/* Contenu des sections - maintenant avec padding interne */}
          <div style={{ 
            padding: '2rem', 
            width: '100%', 
            minHeight: '100vh',
            boxSizing: 'border-box'
          }}>
            {activeSection === 'settings' && (
              <div style={{ width: '100%' }}>
                <h2 style={{ 
                  margin: '0 0 3rem 0', 
                  color: theme.colors.primary,
                  fontSize: '2rem',
                  fontWeight: '600'
                }}>
                  Paramètres OSC
                </h2>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '3rem',
                  width: '100%'
                }}>
                  <div style={{ width: '100%' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '1.1rem',
                      color: theme.colors.text,
                      marginBottom: '1rem',
                      fontWeight: '600'
                    }}>
                      Adresse IP de destination
                    </label>
                    <input
                      type="text"
                      value={oscConfig.host}
                      onChange={(e) => setOscConfig(prev => ({ ...prev, host: e.target.value }))}
                      style={{
                        width: '100%',
                        backgroundColor: `${theme.colors.background}40`,
                        border: `2px solid ${theme.colors.surfaceLight}`,
                        borderRadius: '0.75rem',
                        padding: '1.25rem 1.5rem',
                        color: theme.colors.text,
                        fontSize: '1.2rem',
                        outline: 'none',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      placeholder="192.168.1.100"
                    />
                  </div>

                  <div style={{ width: '100%' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '1.1rem',
                      color: theme.colors.text,
                      marginBottom: '1rem',
                      fontWeight: '600'
                    }}>
                      Port OSC
                    </label>
                    <input
                      type="number"
                      value={oscConfig.port}
                      onChange={(e) => setOscConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 8000 }))}
                      style={{
                        width: '100%',
                        backgroundColor: `${theme.colors.background}40`,
                        border: `2px solid ${theme.colors.surfaceLight}`,
                        borderRadius: '0.75rem',
                        padding: '1.25rem 1.5rem',
                        color: theme.colors.text,
                        fontSize: '1.2rem',
                        outline: 'none',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      placeholder="8000"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'themes' && (
              <div style={{ width: '100%' }}>
                <h2 style={{ 
                  margin: '0 0 3rem 0', 
                  color: theme.colors.secondary,
                  fontSize: '2rem',
                  fontWeight: '600'
                }}>
                  Thèmes visuels
                </h2>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '2rem',
                  marginBottom: '3rem',
                  width: '100%'
                }}>
                  {Object.entries(themes).map(([themeKey, themeData]) => (
                    <div
                      key={themeKey}
                      onClick={() => setTheme(themeKey)}
                      style={{
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        border: currentTheme === themeKey 
                          ? `3px solid ${themeData.colors.primary}` 
                          : `2px solid ${theme.colors.surfaceLight}`,
                        backgroundColor: currentTheme === themeKey 
                          ? `${themeData.colors.primary}20` 
                          : `${theme.colors.surfaceLight}15`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: currentTheme === themeKey ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: currentTheme === themeKey 
                          ? `0 15px 50px ${themeData.colors.primary}40`
                          : `0 8px 30px ${theme.colors.background}30`,
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{
                          width: '4rem',
                          height: '4rem',
                          borderRadius: '1rem',
                          background: themeData.gradients.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: 'white',
                          boxShadow: `0 8px 25px ${themeData.colors.primary}40`
                        }}>
                          {themeKey === 'default' ? '🎛️' : themeKey === 'cyberpunk' ? '🌈' : '📻'}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: theme.colors.text,
                            textTransform: 'capitalize',
                            marginBottom: '0.5rem'
                          }}>
                            {themeKey === 'default' ? 'Défaut' : themeKey === 'cyberpunk' ? 'Cyberpunk' : 'Analog'}
                          </h3>
                          <p style={{
                            margin: 0,
                            fontSize: '1rem',
                            color: theme.colors.textMuted,
                            lineHeight: '1.4'
                          }}>
                            {themeKey === 'default' ? 'Style moderne et équilibré' : 
                             themeKey === 'cyberpunk' ? 'Style futuriste néon' : 'Style vintage chaleureux'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Palette de couleurs */}
                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        marginBottom: '1.5rem'
                      }}>
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '50%',
                          backgroundColor: themeData.colors.primary,
                          border: '3px solid white',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }} />
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '50%',
                          backgroundColor: themeData.colors.secondary,
                          border: '3px solid white',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }} />
                        <div style={{
                          width: '3rem',
                          height: '3rem',
                          borderRadius: '50%',
                          backgroundColor: themeData.colors.success,
                          border: '3px solid white',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                      
                      {currentTheme === themeKey && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          color: themeData.colors.primary,
                          fontSize: '1.1rem',
                          fontWeight: '700'
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>✓</span>
                          <span>Thème actif</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'debug' && (
              <div style={{ width: '100%' }}>
                <h2 style={{ 
                  margin: '0 0 3rem 0', 
                  color: theme.colors.error,
                  fontSize: '2rem',
                  fontWeight: '600'
                }}>
                  Console de debug
                </h2>
                
                <div style={{
                  backgroundColor: `${theme.colors.background}70`,
                  borderRadius: '1rem',
                  padding: '2rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  border: `2px solid ${theme.colors.surfaceLight}`,
                  marginBottom: '2rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  {debugInfo.logs.length === 0 ? (
                    <div style={{ 
                      color: theme.colors.textMuted, 
                      fontStyle: 'italic',
                      textAlign: 'center',
                      padding: '3rem 0',
                      fontSize: '1.1rem'
                    }}>
                      Aucun log disponible...
                    </div>
                  ) : (
                    debugInfo.logs.map((log, i) => (
                      <div key={i} style={{ 
                        color: theme.colors.text, 
                        marginBottom: '0.75rem',
                        padding: '0.5rem 0',
                        borderBottom: `1px solid ${theme.colors.surfaceLight}30`,
                        wordBreak: 'break-all'
                      }}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
                
                <button
                  onClick={() => setDebugInfo(prev => ({ ...prev, logs: [] }))}
                  style={{
                    padding: '1.25rem 2.5rem',
                    backgroundColor: theme.colors.error,
                    color: 'white',
                    border: 'none',
                    borderRadius: '1rem',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 6px 20px ${theme.colors.error}40`
                  }}
                >
                  Vider les logs
                </button>
              </div>
            )}

            {activeSection === 'info' && (
              <div style={{ width: '100%' }}>
                <h2 style={{ 
                  margin: '0 0 3rem 0', 
                  color: theme.colors.success,
                  fontSize: '2rem',
                  fontWeight: '600'
                }}>
                  Guide d'utilisation
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', width: '100%' }}>
                  <div style={{
                    padding: '2.5rem',
                    backgroundColor: `${theme.colors.primary}10`,
                    border: `2px solid ${theme.colors.primary}30`,
                    borderRadius: '1.5rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 2rem 0', 
                      color: theme.colors.primary,
                      fontSize: '1.5rem',
                      fontWeight: '600'
                    }}>
                      Contrôles tactiles
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2rem',
                      fontSize: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <div style={{ 
                          minWidth: '3.5rem', 
                          height: '3.5rem',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          1
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: theme.colors.text, marginBottom: '0.5rem', fontSize: '1.2rem' }}>Tap simple</div>
                          <div style={{ color: theme.colors.textMuted, lineHeight: '1.6', fontSize: '1rem' }}>Touchez une case numérique pour l'éditer directement avec le clavier</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <div style={{ 
                          minWidth: '3.5rem', 
                          height: '3.5rem',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.secondary,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          2
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: theme.colors.text, marginBottom: '0.5rem', fontSize: '1.2rem' }}>Swipe vertical</div>
                          <div style={{ color: theme.colors.textMuted, lineHeight: '1.6', fontSize: '1rem' }}>Glissez vers le haut ou le bas pour incrémenter rapidement les valeurs</div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                        <div style={{ 
                          minWidth: '3.5rem', 
                          height: '3.5rem',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.success,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          3
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: theme.colors.text, marginBottom: '0.5rem', fontSize: '1.2rem' }}>Long press</div>
                          <div style={{ color: theme.colors.textMuted, lineHeight: '1.6', fontSize: '1rem' }}>Maintenez appuyé 500ms pour ouvrir une grille de sélection rapide</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '2.5rem',
                    backgroundColor: `${theme.colors.secondary}10`,
                    border: `2px solid ${theme.colors.secondary}30`,
                    borderRadius: '1.5rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <h3 style={{ 
                      margin: '0 0 1.5rem 0', 
                      color: theme.colors.secondary,
                      fontSize: '1.5rem',
                      fontWeight: '600'
                    }}>
                      Fonctionnalités principales
                    </h3>
                    <ul style={{ 
                      margin: 0, 
                      padding: '0 0 0 2rem', 
                      color: theme.colors.text,
                      lineHeight: '2',
                      fontSize: '1rem'
                    }}>
                      <li>Contrôles MIDI en temps réel via capteurs mobiles</li>
                      <li>Support complet des capteurs : gyroscope, accéléromètre, orientation</li>
                      <li>Communication OSC vers DAW et synthétiseurs</li>
                      <li>Système de presets personnalisables et sauvegardables</li>
                      <li>Clavier MIDI virtuel intégré</li>
                      <li>Système d'inertie physique pour la zone tactile</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '2rem',
                    backgroundColor: `${theme.colors.error}15`,
                    border: `2px solid ${theme.colors.error}40`,
                    borderRadius: '1rem',
                    fontSize: '1rem',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ 
                      color: theme.colors.error, 
                      fontWeight: '700',
                      marginBottom: '1rem',
                      fontSize: '1.2rem'
                    }}>
                      ⚠️ Prérequis technique
                    </div>
                    <div style={{ color: theme.colors.text, lineHeight: '1.6' }}>
                      Une connexion HTTPS est requise pour accéder aux capteurs des appareils mobiles. 
                      L'application fonctionne en local via localhost ou avec un certificat SSL valide.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-10px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes slideInLeft {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
};

const SensorMidiController = () => {
  const { theme, setTheme, currentTheme } = useTheme();
  
  // États principaux
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [sensorsEnabled, setSensorsEnabled] = useState(false);
  const [sensorsSupport, setSensorsSupport] = useState({
    orientation: false,
    motion: false,
    touch: false,
    https: false
  });

  const [sensorData, setSensorData] = useState({
    gyroscope: { x: 0, y: 0, z: 0 },
    accelerometer: { x: 0, y: 0, z: 0 },
    touch: { x: 0, y: 0, pressure: 0 },
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    volume: { up: 0, down: 0 },
    touchEvents: { touchOn: 0, touchOff: 0 }
  });

  const [oscConfig, setOscConfig] = useState({
    host: '192.168.1.100',
    port: 8000
  });

  const [presets, setPresets] = useState({
    'Touchpad Basic': [
      { id: 1, name: 'Touch X', sensor: 'touch.x', cc: 1, channel: 1, min: 0, max: 127, enabled: true },
      { id: 2, name: 'Touch Y', sensor: 'touch.y', cc: 2, channel: 1, min: 0, max: 127, enabled: true },
      { id: 3, name: 'Pressure', sensor: 'touch.pressure', cc: 3, channel: 1, min: 0, max: 127, enabled: true }
    ],
    'Motion Control': [
      { id: 1, name: 'Tilt α', sensor: 'orientation.alpha', cc: 7, channel: 1, min: 0, max: 127, enabled: true },
      { id: 2, name: 'Tilt β', sensor: 'orientation.beta', cc: 8, channel: 1, min: 0, max: 127, enabled: true },
      { id: 3, name: 'Gyro X', sensor: 'gyroscope.x', cc: 4, channel: 1, min: 0, max: 127, enabled: true },
      { id: 4, name: 'Gyro Y', sensor: 'gyroscope.y', cc: 5, channel: 1, min: 0, max: 127, enabled: true }
    ],
    'Switch Control': [
      { id: 1, name: 'Touch Start', sensor: 'touchEvents.touchOn', cc: 10, channel: 1, min: 0, max: 127, enabled: true },
      { id: 2, name: 'Touch End', sensor: 'touchEvents.touchOff', cc: 11, channel: 1, min: 0, max: 127, enabled: true },
      { id: 3, name: 'Vol Up', sensor: 'volume.up', cc: 12, channel: 1, min: 0, max: 127, enabled: true },
      { id: 4, name: 'Vol Down', sensor: 'volume.down', cc: 13, channel: 1, min: 0, max: 127, enabled: true }
    ]
  });

  const [currentPreset, setCurrentPreset] = useState('Touchpad Basic');
  const [midiMappings, setMidiMappings] = useState(presets['Touchpad Basic']);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [touchFeedback, setTouchFeedback] = useState({
    x: 0,
    y: 0,
    visible: false,
    pressure: 0
  });

  const [ambientCircle, setAmbientCircle] = useState({
    x: 0,
    y: 0,
    visible: false,
    pressure: 0,
    fadeOut: false,
    startScale: 0,
    startOpacity: 0,
    fadeTimeout: null
  });

  const [inertiaSystem, setInertiaSystem] = useState({
    enabled: false,
    velocity: { x: 0, y: 0 },
    position: { x: 0, y: 0 },
    lastPositions: [],
    friction: 0.02,
    lockedPressure: 0
  });

  const [showMidiNotes, setShowMidiNotes] = useState(false);
  const [midiChannel, setMidiChannel] = useState(1);
  const [pressedNotes, setPressedNotes] = useState(new Set());
  const [lastPlayedNote, setLastPlayedNote] = useState(null);
  const [debugInfo, setDebugInfo] = useState({
    visible: false,
    logs: []
  });
  
  const [pieMenu, setPieMenu] = useState({
    visible: false,
    activeSection: null // 'settings', 'debug', 'info'
  });

  const touchAreaRef = useRef(null);
  const intervalRef = useRef(null);

  // Vérification du support des capteurs et HTTPS
  const checkSensorSupport = () => {
    const support = {
      orientation: 'DeviceOrientationEvent' in window,
      motion: 'DeviceMotionEvent' in window,
      touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    };
    
    setSensorsSupport(support);
    debugLog(`Support des capteurs: ${JSON.stringify(support)}`);
    
    if (!support.https && window.location.hostname !== 'localhost') {
      alert('⚠️ Cette application nécessite HTTPS pour accéder aux capteurs mobiles');
    }
    
    return support;
  };

  // Debug logging
  const debugLog = (message) => {
    console.log(`[MIDI Controller] ${message}`);
    setDebugInfo(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`]
    }));
  };

  // Demande de permissions pour les capteurs
  const requestSensorPermissions = async () => {
    try {
      debugLog('Demande des permissions capteurs...');
      
      // iOS 13+ nécessite une permission explicite
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const orientationPermission = await DeviceOrientationEvent.requestPermission();
        debugLog(`Permission orientation: ${orientationPermission}`);
        
        if (orientationPermission !== 'granted') {
          throw new Error('Permission orientation refusée');
        }
      }

      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const motionPermission = await DeviceMotionEvent.requestPermission();
        debugLog(`Permission motion: ${motionPermission}`);
        
        if (motionPermission !== 'granted') {
          throw new Error('Permission motion refusée');
        }
      }

      // Test de disponibilité des capteurs
      const testOrientation = () => {
        return new Promise((resolve) => {
          let resolved = false;
          const handler = (event) => {
            if (!resolved && (event.alpha !== null || event.beta !== null || event.gamma !== null)) {
              window.removeEventListener('deviceorientation', handler);
              resolved = true;
              resolve(true);
            }
          };
          window.addEventListener('deviceorientation', handler);
          setTimeout(() => {
            if (!resolved) {
              window.removeEventListener('deviceorientation', handler);
              resolved = true;
              resolve(false);
            }
          }, 2000);
        });
      };

      const sensorsAvailable = await testOrientation();
      debugLog(`Capteurs disponibles: ${sensorsAvailable}`);
      
      if (!sensorsAvailable) {
        console.warn('Capteurs non disponibles sur ce device');
      }

      setSensorsEnabled(true);
      return true;
    } catch (error) {
      debugLog(`Erreur permissions capteurs: ${error.message}`);
      alert(`❌ Impossible d'activer les capteurs: ${error.message}\nVérifiez les permissions de votre navigateur.`);
      return false;
    }
  };

  // Cleanup des timeouts au démontage
  useEffect(() => {
    return () => {
      if (ambientCircle.fadeTimeout) {
        clearTimeout(ambientCircle.fadeTimeout);
      }
    };
  }, [ambientCircle.fadeTimeout]);

  // Vérifications au démarrage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkSensorSupport();
      debugLog(`User Agent: ${navigator.userAgent}`);
      debugLog(`URL: ${window.location.href}`);
      debugLog(`Protocol: ${window.location.protocol}`);
    }
  }, []);

  // Gestion du monitoring des capteurs avec throttling
  const handleTouchThrottled = throttle((event) => {
    handleTouch(event);
  }, 16); // ~60fps

  useEffect(() => {
    if (isPlaying && sensorsEnabled) {
      startSensorMonitoring();
    } else {
      stopSensorMonitoring();
    }
    return () => {
      stopSensorMonitoring();
    };
  }, [isPlaying, sensorsEnabled]);

  // Système d'inertie
  useEffect(() => {
    if (!inertiaSystem.enabled || !isPlaying) return;

    const animateInertia = () => {
      setInertiaSystem(prev => {
        const rect = touchAreaRef.current?.getBoundingClientRect();
        if (!rect) return prev;

        let newVelX = prev.velocity.x;
        let newVelY = prev.velocity.y;
        let newX = prev.position.x + newVelX;
        let newY = prev.position.y + newVelY;

        // Rebonds sur les bords avec conservation de l'énergie
        if (newX <= 0) {
          newX = 0;
          newVelX = Math.abs(newVelX) * 0.85;
        } else if (newX >= rect.width) {
          newX = rect.width;
          newVelX = -Math.abs(newVelX) * 0.85;
        }

        if (newY <= 0) {
          newY = 0;
          newVelY = Math.abs(newVelY) * 0.85;
        } else if (newY >= rect.height) {
          newY = rect.height;
          newVelY = -Math.abs(newVelY) * 0.85;
        }

        // Application du frottement
        const frictionFactor = Math.max(0.95, 1 - prev.friction);
        newVelX *= frictionFactor;
        newVelY *= frictionFactor;

        // Arrêter si vélocité très faible
        if (Math.abs(newVelX) < 0.5 && Math.abs(newVelY) < 0.5) {
          newVelX = 0;
          newVelY = 0;
        }

        // Mettre à jour les coordonnées MIDI
        const midiX = Math.round((newX / rect.width) * 127);
        const midiY = Math.round((newY / rect.height) * 127);

        setSensorData(prevSensor => ({
          ...prevSensor,
          touch: {
            x: Math.max(0, Math.min(127, midiX)),
            y: Math.max(0, Math.min(127, midiY)),
            pressure: prev.lockedPressure
          }
        }));

        // Mettre à jour le feedback visuel
        setTouchFeedback({
          x: newX,
          y: newY,
          visible: true,
          pressure: prev.lockedPressure
        });

        return {
          ...prev,
          velocity: { x: newVelX, y: newVelY },
          position: { x: newX, y: newY }
        };
      });
    };

    const interval = setInterval(animateInertia, 16);
    return () => clearInterval(interval);
  }, [inertiaSystem.enabled, isPlaying]);

  const startSensorMonitoring = async () => {
    if (!sensorsEnabled) {
      debugLog('Capteurs non activés, monitoring ignoré');
      return;
    }

    debugLog('Démarrage du monitoring des capteurs...');

    const handleOrientation = (event) => {
      setSensorData(prev => ({
        ...prev,
        orientation: {
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0
        }
      }));
    };

    const handleMotion = (event) => {
      setSensorData(prev => ({
        ...prev,
        accelerometer: {
          x: event.accelerationIncludingGravity?.x || 0,
          y: event.accelerationIncludingGravity?.y || 0,
          z: event.accelerationIncludingGravity?.z || 0
        },
        gyroscope: {
          x: event.rotationRate?.alpha || 0,
          y: event.rotationRate?.beta || 0,
          z: event.rotationRate?.gamma || 0
        }
      }));
    };

    // Gestion des boutons de volume
    const handleKeyDown = (event) => {
      if (event.code === 'AudioVolumeUp' || event.keyCode === 175) {
        event.preventDefault();
        setSensorData(prev => ({
          ...prev,
          volume: { ...prev.volume, up: 127 }
        }));
        setTimeout(() => {
          setSensorData(prev => ({
            ...prev,
            volume: { ...prev.volume, up: 0 }
          }));
        }, 100);
      }
      if (event.code === 'AudioVolumeDown' || event.keyCode === 174) {
        event.preventDefault();
        setSensorData(prev => ({
          ...prev,
          volume: { ...prev.volume, down: 127 }
        }));
        setTimeout(() => {
          setSensorData(prev => ({
            ...prev,
            volume: { ...prev.volume, down: 0 }
          }));
        }, 100);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('keydown', handleKeyDown);

    // Stocker les références pour le cleanup
    window._sensorHandlers = {
      handleOrientation,
      handleMotion,
      handleKeyDown
    };

    intervalRef.current = setInterval(() => {
      sendOSCData();
    }, 33); // ~30fps pour l'envoi OSC

    debugLog('Monitoring des capteurs démarré');
  };

  const stopSensorMonitoring = () => {
    debugLog('Arrêt du monitoring des capteurs...');
    
    if (window._sensorHandlers) {
      window.removeEventListener('deviceorientation', window._sensorHandlers.handleOrientation);
      window.removeEventListener('devicemotion', window._sensorHandlers.handleMotion);
      window.removeEventListener('keydown', window._sensorHandlers.handleKeyDown);
      delete window._sensorHandlers;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleTouch = (event) => {
    event.preventDefault();
    const rect = touchAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
    
    if (touch) {
      const pixelX = touch.clientX - rect.left;
      const pixelY = touch.clientY - rect.top;
      const x = (pixelX / rect.width) * 127;
      const y = (pixelY / rect.height) * 127;
      const pressure = touch.force || (event.type.includes('mouse') ? 1 : 0.5);

      // Déclencher touchOn au début du toucher
      if (event.type === 'touchstart' || event.type === 'mousedown') {
        setSensorData(prev => ({
          ...prev,
          touchEvents: { ...prev.touchEvents, touchOn: 127 }
        }));
        
        setTimeout(() => {
          setSensorData(prev => ({
            ...prev,
            touchEvents: { ...prev.touchEvents, touchOn: 0 }
          }));
        }, 50);
      }

      // Calculer la vélocité pour l'inertie avec historique
      setInertiaSystem(prev => {
        const currentTime = Date.now();
        const newPosition = { x: pixelX, y: pixelY, time: currentTime };
        
        const positions = [...prev.lastPositions, newPosition].slice(-5);
        
        let velX = 0, velY = 0;
        if (positions.length >= 2) {
          const recent = positions.slice(-3);
          const timeDiff = recent[recent.length - 1].time - recent[0].time;
          
          if (timeDiff > 0) {
            velX = (recent[recent.length - 1].x - recent[0].x) / timeDiff * 16;
            velY = (recent[recent.length - 1].y - recent[0].y) / timeDiff * 16;
          }
        }
        
        return {
          ...prev,
          velocity: { 
            x: velX * 2,
            y: velY * 2 
          },
          position: { x: pixelX, y: pixelY },
          lastPositions: positions,
          lockedPressure: pressure
        };
      });

      setSensorData(prev => ({
        ...prev,
        touch: { 
          x: Math.max(0, Math.min(127, Math.round(x))), 
          y: Math.max(0, Math.min(127, Math.round(y))), 
          pressure 
        }
      }));

      setTouchFeedback({
        x: pixelX,
        y: pixelY,
        visible: true,
        pressure
      });

      setAmbientCircle(prev => {
        // Annuler le fadeOut et le timeout si on touche à nouveau
        if (prev.fadeTimeout) {
          clearTimeout(prev.fadeTimeout);
        }
        
        return {
          x: pixelX,
          y: pixelY,
          visible: true,
          pressure,
          fadeOut: false,
          startScale: 0,
          startOpacity: 0,
          fadeTimeout: null
        };
      });
    }
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    
    const hasActiveTouches = event.touches && event.touches.length > 0;
    const isMouseEvent = event.type.includes('mouse');
    
    if (!hasActiveTouches || isMouseEvent) {
      setSensorData(prev => ({
        ...prev,
        touchEvents: { ...prev.touchEvents, touchOff: 127 }
      }));
      
      setTimeout(() => {
        setSensorData(prev => ({
          ...prev,
          touchEvents: { ...prev.touchEvents, touchOff: 0 }
        }));
      }, 50);
      
      // Déclencher l'effet de fade out pour le cercle ambiant seulement si pas de touches actives
      if (!hasActiveTouches || isMouseEvent) {
        setAmbientCircle(prev => {
          // Annuler le timeout précédent s'il existe
          if (prev.fadeTimeout) {
            clearTimeout(prev.fadeTimeout);
          }
          
          // Sauvegarder les valeurs actuelles pour une transition fluide
          const currentScale = 0.6 + prev.pressure * 0.8;
          const currentOpacity = 0.8 + prev.pressure * 0.4;
          
          const newTimeout = setTimeout(() => {
            setAmbientCircle(current => ({
              ...current,
              visible: false,
              fadeOut: false,
              fadeTimeout: null
            }));
          }, 6000);
          
          return {
            ...prev,
            fadeOut: true,
            startScale: currentScale,
            startOpacity: currentOpacity,
            fadeTimeout: newTimeout
          };
        });
      }
      
      if (!inertiaSystem.enabled) {
        setTouchFeedback(prev => ({
          ...prev,
          visible: false
        }));
      }
    }
  };

  const getSensorValue = (sensorPath) => {
    const keys = sensorPath.split('.');
    let value = sensorData;
    for (const key of keys) {
      value = value?.[key];
    }
    return value || 0;
  };

  const mapValue = (value, mapping) => {
    let normalizedValue = 0;
    
    if (mapping.sensor.includes('orientation.alpha')) {
      // Alpha va de 0 à 360
      normalizedValue = value / 360;
    } else if (mapping.sensor.includes('orientation.beta')) {
      // Beta va de -180 à 180, on normalise à 0-1
      normalizedValue = (value + 180) / 360;
    } else if (mapping.sensor.includes('orientation.gamma')) {
      // Gamma va de -90 à 90, on normalise à 0-1
      normalizedValue = (value + 90) / 180;
    } else if (mapping.sensor.includes('gyroscope')) {
      // Gyroscope peut aller de -180 à 180, on normalise à 0-1
      normalizedValue = (value + 180) / 360;
    } else if (mapping.sensor.includes('accelerometer')) {
      // Accéléromètre peut aller de -20 à 20 environ, on normalise à 0-1
      normalizedValue = Math.max(0, Math.min(1, (value + 20) / 40));
    } else if (mapping.sensor.includes('pressure')) {
      // Pression va de 0 à 1 (force touch), déjà normalisée
      normalizedValue = Math.max(0, Math.min(1, value));
    } else if (mapping.sensor.includes('volume') || mapping.sensor.includes('touchEvents')) {
      // Boutons : 0 ou 127, on mappe en binaire
      normalizedValue = value > 0 ? 1 : 0;
    } else {
      // Touch X, Y : entre 0 et 127
      normalizedValue = value / 127;
    }
    
    // Mapping proportionnel : min + (valeurNormalisée * (max - min))
    const mappedValue = mapping.min + (normalizedValue * (mapping.max - mapping.min));
    
    // S'assurer que la valeur reste dans les limites MIDI (0-127)
    return Math.round(Math.max(0, Math.min(127, mappedValue)));
  };

  const sendOSCData = () => {
    const enabledMappings = midiMappings.filter(m => m.enabled);
    const oscData = {};
    
    enabledMappings.forEach(mapping => {
      const rawValue = getSensorValue(mapping.sensor);
      const mappedValue = mapValue(rawValue, mapping);
      oscData[`cc${mapping.cc}_ch${mapping.channel}`] = mappedValue;
    });

    console.log('OSC →', {
      address: '/midi',
      host: oscConfig.host,
      port: oscConfig.port,
      data: oscData,
      timestamp: Date.now()
    });
  };

  const loadPreset = (presetName) => {
    if (presets[presetName]) {
      setCurrentPreset(presetName);
      setMidiMappings(presets[presetName]);
      debugLog(`Preset chargé: ${presetName}`);
    }
  };

  const savePreset = (presetName) => {
    if (presetName.trim()) {
      const newPresets = {
        ...presets,
        [presetName]: [...midiMappings]
      };
      setPresets(newPresets);
      setCurrentPreset(presetName);
      debugLog(`Preset sauvegardé: ${presetName}`);
      setShowSavePreset(false);
      setNewPresetName('');
    }
  };

  const toggleInertia = () => {
    const newEnabled = !inertiaSystem.enabled;
    
    setInertiaSystem(prev => ({
      ...prev,
      enabled: newEnabled,
      velocity: { x: 0, y: 0 }
    }));
    
    debugLog(`Inertie ${newEnabled ? 'activée' : 'désactivée'}`);
    
    if (!newEnabled) {
      setTouchFeedback(prevFeedback => ({
        ...prevFeedback,
        visible: false
      }));
    }
  };

  const updateFriction = (friction) => {
    setInertiaSystem(prev => ({
      ...prev,
      friction: Math.max(0, Math.min(0.15, friction))
    }));
  };

  // Notes MIDI - 2 octaves à partir du Do central (C4 = 60)
  const midiNotes = [
    { note: 48, name: 'C3' }, { note: 49, name: 'C#3' }, { note: 50, name: 'D3' }, { note: 51, name: 'D#3' },
    { note: 52, name: 'E3' }, { note: 53, name: 'F3' }, { note: 54, name: 'F#3' }, { note: 55, name: 'G3' },
    { note: 56, name: 'G#3' }, { note: 57, name: 'A3' }, { note: 58, name: 'A#3' }, { note: 59, name: 'B3' },
    { note: 60, name: 'C4' }, { note: 61, name: 'C#4' }, { note: 62, name: 'D4' }, { note: 63, name: 'D#4' },
    { note: 64, name: 'E4' }, { note: 65, name: 'F4' }, { note: 66, name: 'F#4' }, { note: 67, name: 'G4' },
    { note: 68, name: 'G#4' }, { note: 69, name: 'A4' }, { note: 70, name: 'A#4' }, { note: 71, name: 'B4' },
    { note: 72, name: 'C5' }, { note: 73, name: 'C#5' }, { note: 74, name: 'D5' }, { note: 75, name: 'D#5' },
    { note: 76, name: 'E5' }, { note: 77, name: 'F5' }, { note: 78, name: 'F#5' }, { note: 79, name: 'G5' }
  ];

  const sendMidiNote = (note, velocity = 127, isNoteOn = true) => {
    const noteData = {
      note,
      velocity: isNoteOn ? velocity : 0,
      channel: midiChannel,
      type: isNoteOn ? 'noteOn' : 'noteOff'
    };

    console.log('MIDI Note →', {
      address: '/midi/note',
      host: oscConfig.host,
      port: oscConfig.port,
      data: noteData
    });
  };

  const handleNotePress = (note, noteName) => {
    if (pressedNotes.has(note)) return;

    setLastPlayedNote(note);
    setPressedNotes(prev => new Set(prev).add(note));
    sendMidiNote(note, 127, true);
    debugLog(`Note jouée: ${noteName} (${note})`);
  };

  const handleNoteRelease = (note) => {
    setPressedNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
    sendMidiNote(note, 0, false);
  };

  const updateMapping = (id, field, value) => {
    setMidiMappings(prev => prev.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ));
  };

  const toggleMapping = (id) => {
    setMidiMappings(prev => prev.map(mapping => 
      mapping.id === id ? { ...mapping, enabled: !mapping.enabled } : mapping
    ));
  };

  const addMapping = () => {
    const newId = Math.max(...midiMappings.map(m => m.id)) + 1;
    setMidiMappings(prev => [...prev, {
      id: newId,
      name: 'Nouveau',
      sensor: 'touch.x',
      cc: newId,
      channel: 1,
      min: 0,
      max: 127,
      enabled: false
    }]);
  };

  const removeMapping = (id) => {
    setMidiMappings(prev => prev.filter(m => m.id !== id));
  };

  const sensorOptions = [
    { value: 'touch.x', label: 'Touch X' },
    { value: 'touch.y', label: 'Touch Y' },
    { value: 'touch.pressure', label: 'Pressure' },
    { value: 'touchEvents.touchOn', label: 'Touch On' },
    { value: 'touchEvents.touchOff', label: 'Touch Off' },
    { value: 'volume.up', label: 'Vol Up' },
    { value: 'volume.down', label: 'Vol Down' },
    { value: 'gyroscope.x', label: 'Gyro X' },
    { value: 'gyroscope.y', label: 'Gyro Y' },
    { value: 'gyroscope.z', label: 'Gyro Z' },
    { value: 'orientation.alpha', label: 'Tilt α' },
    { value: 'orientation.beta', label: 'Tilt β' },
    { value: 'orientation.gamma', label: 'Tilt γ' },
    { value: 'accelerometer.x', label: 'Accel X' },
    { value: 'accelerometer.y', label: 'Accel Y' },
    { value: 'accelerometer.z', label: 'Accel Z' }
  ];

  const handlePlayToggle = async () => {
    if (!isPlaying && !sensorsEnabled) {
      const success = await requestSensorPermissions();
      if (success) {
        setIsPlaying(true);
        debugLog('Mode PLAY activé avec capteurs');
      }
    } else {
      setIsPlaying(!isPlaying);
      debugLog(`Mode ${!isPlaying ? 'PLAY' : 'STOP'}`);
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden',
      userSelect: 'none'
    }}>
      
      {/* Écran de permissions capteurs */}
      {!sensorsEnabled && !isPlaying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme.gradients.surface,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          gap: '2rem',
          padding: '2rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🎛️
          </div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            background: theme.gradients.primary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            MIDI Controller Mobile
          </h1>
          
          <p style={{
            textAlign: 'center',
            color: theme.colors.textMuted,
            maxWidth: '400px',
            lineHeight: '1.6'
          }}>
            Transformez votre smartphone en contrôleur MIDI professionnel utilisant les capteurs intégrés
          </p>

          <div style={{
            padding: '1rem',
            backgroundColor: !sensorsSupport.https ? `${theme.colors.error}20` : `${theme.colors.success}20`,
            border: `1px solid ${!sensorsSupport.https ? theme.colors.error : theme.colors.success}`,
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            color: !sensorsSupport.https ? theme.colors.error : theme.colors.success,
            maxWidth: '350px'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
              {!sensorsSupport.https ? '⚠️ Configuration requise' : '✅ Prêt à l\'utilisation'}
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              {!sensorsSupport.https 
                ? 'HTTPS requis pour l\'accès aux capteurs mobiles'
                : 'Tous les capteurs sont supportés par votre navigateur'
              }
            </div>
          </div>

          <button
            onClick={async () => {
              const success = await requestSensorPermissions();
              if (success) {
                alert('✅ Capteurs activés ! Vous pouvez maintenant utiliser l\'application.');
              }
            }}
            style={{
              padding: '1rem 3rem',
              background: theme.gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '2rem',
              fontSize: '1.2rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: `0 8px 32px ${theme.colors.primary}40`,
              transition: 'all 0.3s ease',
              minWidth: '280px'
            }}
          >
            🔐 Activer les Capteurs
          </button>

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: theme.colors.textMuted
          }}>
            <span>Orientation: {sensorsSupport.orientation ? '✅' : '❌'}</span>
            <span>Motion: {sensorsSupport.motion ? '✅' : '❌'}</span>
            <span>Touch: {sensorsSupport.touch ? '✅' : '❌'}</span>
            <span>HTTPS: {sensorsSupport.https ? '✅' : '❌'}</span>
          </div>
        </div>
      )}
      
      {/* Bouton Menu simple en haut à droite - visible partout sauf écran de permissions */}
      {sensorsEnabled && (
        <button
          onClick={() => setPieMenu(prev => ({ ...prev, visible: !prev.visible, activeSection: null }))}
          style={{
            position: 'fixed',
            top: '2rem',
            right: '2rem',
            width: '2.5rem',
            height: '2.5rem',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            color: theme.colors.text,
            cursor: 'pointer',
            zIndex: 350, // Z-index plus élevé pour être au-dessus de tout
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            transition: 'all 0.3s ease',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
          title="Menu"
        >
          <div style={{
            width: '18px',
            height: '2px',
            backgroundColor: theme.colors.text,
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            transform: pieMenu.visible ? 'rotate(45deg) translateY(5px)' : 'rotate(0deg)'
          }} />
          <div style={{
            width: '18px',
            height: '2px',
            backgroundColor: theme.colors.text,
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            opacity: pieMenu.visible ? 0 : 1
          }} />
          <div style={{
            width: '18px',
            height: '2px',
            backgroundColor: theme.colors.text,
            borderRadius: '1px',
            transition: 'all 0.3s ease',
            transform: pieMenu.visible ? 'rotate(-45deg) translateY(-5px)' : 'rotate(0deg)'
          }} />
        </button>
      )}

      {/* Menu Simple - Z-index élevé pour être au-dessus de tout */}
      {sensorsEnabled && (
        <SimpleMenu
          visible={pieMenu.visible}
          activeSection={pieMenu.activeSection}
          onSectionChange={(section) => setPieMenu(prev => ({ ...prev, activeSection: section }))}
          onClose={() => setPieMenu({ visible: false, activeSection: null })}
          theme={theme}
          debugInfo={debugInfo}
          setDebugInfo={setDebugInfo}
          oscConfig={oscConfig}
          setOscConfig={setOscConfig}
          currentTheme={currentTheme}
          setTheme={setTheme}
        />
      )}

      {/* Zone tactile plein écran */}
      <div
        ref={touchAreaRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: isPlaying 
            ? theme.gradients.main
            : theme.gradients.surface,
          cursor: isPlaying ? 'crosshair' : 'default',
          transition: 'background 0.3s ease'
        }}
        onTouchStart={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          handleTouchThrottled(e);
        } : undefined}
        onTouchMove={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          handleTouchThrottled(e);
        } : undefined}
        onTouchEnd={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          handleTouchEnd(e);
        } : undefined}
        onMouseDown={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          handleTouchThrottled(e);
        } : undefined}
        onMouseMove={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          if (e.buttons > 0) {
            handleTouchThrottled(e);
          }
        } : undefined}
        onMouseUp={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          handleTouchEnd(e);
        } : undefined}
        onMouseLeave={isPlaying ? (e) => {
          if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) return;
          if (e.buttons > 0) {
            handleTouchEnd(e);
          }
        } : undefined}
      >
        
        {/* Grille tactile */}
        {isPlaying && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.1,
            background: `
              linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '12.5% 12.5%'
          }} />
        )}

        {/* Feedback tactile - Grand cercle ambiant */}
        {isPlaying && ambientCircle.visible && (
          <div style={{
            position: 'absolute',
            left: ambientCircle.x - 150,
            top: ambientCircle.y - 150,
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: `rgba(255, 255, 255, ${ambientCircle.fadeOut 
              ? 0.02 
              : 0.06 + ambientCircle.pressure * 0.15})`,
            filter: `blur(${ambientCircle.fadeOut ? 40 : 20 + ambientCircle.pressure * 15}px)`,
            pointerEvents: 'none',
            transform: ambientCircle.fadeOut 
              ? `scale(${ambientCircle.startScale * 1.8})`
              : `scale(${0.6 + ambientCircle.pressure * 0.8})`,
            transition: ambientCircle.fadeOut
              ? 'opacity 6s ease-out, transform 6s ease-out, filter 6s ease-out'
              : 'transform 0.15s ease-out, filter 0.15s ease-out, background-color 0.15s ease-out',
            opacity: ambientCircle.fadeOut ? 0 : (0.8 + ambientCircle.pressure * 0.4),
            zIndex: 2,
            boxShadow: ambientCircle.fadeOut
              ? 'none'
              : `0 0 ${80 + ambientCircle.pressure * 60}px rgba(255, 255, 255, ${0.1 + ambientCircle.pressure * 0.2})`
          }} />
        )}

        {/* Feedback tactile normal */}
        {isPlaying && touchFeedback.visible && (
          <div style={{
            position: 'absolute',
            left: touchFeedback.x - 25,
            top: touchFeedback.y - 25,
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: `rgba(255, 255, 255, ${0.3 + touchFeedback.pressure * 0.4})`,
            border: '2px solid rgba(255, 255, 255, 0.8)',
            pointerEvents: 'none',
            transform: `scale(${0.5 + touchFeedback.pressure * 0.5})`,
            transition: touchFeedback.visible 
              ? 'transform 0.1s ease-out' 
              : 'opacity 0.3s ease-out, transform 0.3s ease-out',
            opacity: touchFeedback.visible ? 1 : 0,
            zIndex: 5
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: inertiaSystem.enabled ? theme.colors.secondary : 'rgba(255, 255, 255, 0.6)',
              animation: touchFeedback.visible ? 'pulse 1s infinite' : 'none'
            }} />
          </div>
        )}

        {/* Page de mapping MIDI (visible quand arrêté) */}
        {!isPlaying && sensorsEnabled && (
          <div style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            right: '2rem',
            bottom: '8rem',
            overflowY: 'auto',
            zIndex: 10
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={currentPreset}
                    onChange={(e) => loadPreset(e.target.value)}
                    style={{
                      backgroundColor: theme.colors.surface,
                      border: `2px solid ${theme.colors.surfaceLight}`,
                      borderRadius: '0.5rem',
                      padding: '0.75rem 1rem',
                      color: theme.colors.text,
                      fontSize: '1rem',
                      fontWeight: '400',
                      cursor: 'pointer',
                      minWidth: '200px'
                    }}
                  >
                    {Object.keys(presets).map(presetName => (
                      <option key={presetName} value={presetName} style={{ backgroundColor: theme.colors.surface }}>
                        {presetName}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => setShowSavePreset(true)}
                    style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      borderRadius: '0.5rem',
                      backgroundColor: theme.colors.surfaceLight,
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      transition: 'all 0.2s ease'
                    }}
                    title="Sauvegarder preset"
                  >
                    💾
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {midiMappings.map(mapping => (
                <div key={mapping.id} style={{
                  padding: '0.75rem',
                  backgroundColor: mapping.enabled ? `${theme.colors.success}20` : `${theme.colors.surfaceLight}50`,
                  border: `1px solid ${mapping.enabled ? theme.colors.success : theme.colors.surfaceLight}`,
                  borderRadius: '0.5rem'
                }}>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 100px',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <button
                      onClick={() => toggleMapping(mapping.id)}
                      style={{
                        width: '1.75rem',
                        height: '1.75rem',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: mapping.enabled ? theme.colors.success : theme.colors.surfaceLight,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.7rem'
                      }}
                    >
                      {mapping.enabled ? '✓' : '○'}
                    </button>

                    <input
                      type="text"
                      value={mapping.name}
                      onChange={(e) => updateMapping(mapping.id, 'name', e.target.value)}
                      style={{
                        backgroundColor: `${theme.colors.surfaceLight}80`,
                        border: `1px solid ${theme.colors.surfaceLight}`,
                        borderRadius: '0.25rem',
                        padding: '0.4rem',
                        color: theme.colors.text,
                        fontSize: '0.85rem'
                      }}
                    />

                    <select
                      value={mapping.sensor}
                      onChange={(e) => updateMapping(mapping.id, 'sensor', e.target.value)}
                      style={{
                        backgroundColor: `${theme.colors.surfaceLight}80`,
                        border: `1px solid ${theme.colors.surfaceLight}`,
                        borderRadius: '0.25rem',
                        padding: '0.4rem',
                        color: theme.colors.text,
                        fontSize: '0.75rem'
                      }}
                    >
                      {sensorOptions.map(option => (
                        <option key={option.value} value={option.value} style={{ backgroundColor: theme.colors.surface }}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr auto',
                    gap: '0.5rem',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => removeMapping(mapping.id)}
                      style={{
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: theme.colors.error,
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.65rem'
                      }}
                    >
                      ✕
                    </button>

{['CC', 'CH', 'MIN', 'MAX'].map((label, idx) => (
                      <MidiValueControl
                        key={label}
                        label={label}
                        value={mapping[['cc', 'channel', 'min', 'max'][idx]]}
                        min={idx === 0 ? 1 : idx === 1 ? 1 : 0}
                        max={idx === 0 ? 127 : idx === 1 ? 16 : 127}
                        onChange={(value) => updateMapping(mapping.id, ['cc', 'channel', 'min', 'max'][idx], value)}
                        theme={theme}
                      />
                    ))}

                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: mapping.enabled ? theme.colors.success : theme.colors.surfaceLight,
                      minWidth: '2rem',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      {mapping.enabled ? mapValue(getSensorValue(mapping.sensor), mapping) : '—'}
                    </span>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addMapping}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '1rem',
                  backgroundColor: `${theme.colors.success}20`,
                  border: `2px dashed ${theme.colors.success}`,
                  borderRadius: '0.5rem',
                  color: theme.colors.success,
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  transition: 'all 0.2s ease'
                }}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Mappings en mode live */}
        {isPlaying && sensorsEnabled && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            right: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            pointerEvents: 'none',
            zIndex: 10,
            maxHeight: '82vh',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              <div style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '1rem',
                backgroundColor: `${theme.colors.success}30`,
                border: `1px solid ${theme.colors.success}`,
                color: theme.colors.success
              }}>
                🟢 LIVE
              </div>
              
              <div style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '1rem',
                backgroundColor: `${theme.colors.primary}30`,
                border: `1px solid ${theme.colors.primary}`,
                color: theme.colors.primary
              }}>
                OSC → {oscConfig.host}:{oscConfig.port}
              </div>
            </div>

            {(sensorData.volume.up > 0 || sensorData.volume.down > 0) && (
              <div style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                backgroundColor: `${theme.colors.secondary}30`,
                border: `1px solid ${theme.colors.secondary}`,
                fontSize: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                flexShrink: 0
              }}>
                {sensorData.volume.up > 0 && (
                  <div style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>🔊 VOL+</div>
                )}
                {sensorData.volume.down > 0 && (
                  <div style={{ color: theme.colors.secondary, fontWeight: 'bold' }}>🔉 VOL-</div>
                )}
              </div>
            )}

            <div style={{
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              fontSize: '0.8rem',
              flexGrow: 1,
              overflowY: 'auto'
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '0.75rem',
                fontFamily: 'monospace',
                width: '100%'
              }}>
                {midiMappings.filter(m => m.enabled).map(mapping => {
                  const midiValue = mapValue(getSensorValue(mapping.sensor), mapping);
                  const isSwitch = mapping.sensor.includes('volume') || mapping.sensor.includes('touchEvents');
                  
                  return (
                    <div key={mapping.id} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: isSwitch && getSensorValue(mapping.sensor) > 0 
                        ? `${theme.colors.secondary}20` 
                        : `${theme.colors.surfaceLight}20`,
                      border: isSwitch && getSensorValue(mapping.sensor) > 0 
                        ? `1px solid ${theme.colors.secondary}50` 
                        : `1px solid ${theme.colors.surfaceLight}30`,
                      minHeight: '120px'
                    }}>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: theme.colors.textMuted,
                        textAlign: 'center',
                        fontWeight: 'bold'
                      }}>
                        {mapping.name}
                      </div>
                      
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: isSwitch && getSensorValue(mapping.sensor) > 0 
                          ? theme.colors.secondary 
                          : theme.colors.success
                      }}>
                        {midiValue}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.125rem',
                        fontSize: '0.6rem',
                        color: theme.colors.textMuted,
                        textAlign: 'center'
                      }}>
                        <div>CC {mapping.cc}</div>
                        <div>Ch {mapping.channel}</div>
                        <div style={{ 
                          color: isSwitch && getSensorValue(mapping.sensor) > 0 
                            ? theme.colors.secondary 
                            : theme.colors.textMuted,
                          fontSize: '0.55rem'
                        }}>
                          MIDI: {midiValue}
                        </div>
                      </div>
                      
                      <div style={{
                        width: '100%',
                        height: '2px',
                        backgroundColor: `${theme.colors.surfaceLight}50`,
                        borderRadius: '1px',
                        position: 'relative',
                        marginTop: '0.25rem'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          height: '100%',
                          backgroundColor: isSwitch && getSensorValue(mapping.sensor) > 0 
                            ? theme.colors.secondary 
                            : theme.colors.success,
                          borderRadius: '1px',
                          width: `${((midiValue - mapping.min) / (mapping.max - mapping.min)) * 100}%`,
                          transition: 'width 0.1s ease-out'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bouton Play/Stop */}
      {sensorsEnabled && (
        <button
          onClick={handlePlayToggle}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            border: 'none',
            background: isPlaying ? theme.gradients.accent : theme.gradients.primary,
            color: 'white',
            cursor: 'pointer',
            boxShadow: `0 4px 20px ${isPlaying ? theme.colors.secondary : theme.colors.primary}60`,
            zIndex: 100,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isPlaying ? (
            <div style={{
              width: '1rem',
              height: '1rem',
              backgroundColor: 'white',
              borderRadius: '2px'
            }} />
          ) : (
            <div style={{
              width: 0,
              height: 0,
              borderLeft: '0.8rem solid white',
              borderTop: '0.6rem solid transparent',
              borderBottom: '0.6rem solid transparent',
              marginLeft: '2px'
            }} />
          )}
        </button>
      )}

      {/* Bouton Notes MIDI */}
      {sensorsEnabled && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMidiNotes(!showMidiNotes);
          }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '2rem',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: showMidiNotes ? theme.colors.secondary : `${theme.colors.surfaceLight}CC`,
            color: 'white',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: `0 4px 15px ${showMidiNotes ? theme.colors.secondary : theme.colors.surfaceLight}60`,
            zIndex: 300,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            pointerEvents: 'auto'
          }}
          title={showMidiNotes ? 'Fermer le clavier MIDI' : 'Ouvrir le clavier MIDI'}
        >
          🎹
        </button>
      )}

      {/* Bouton d'inertie */}
      {isPlaying && sensorsEnabled && (
        <div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleInertia();
            }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: inertiaSystem.enabled ? theme.colors.primary : `${theme.colors.surfaceLight}CC`,
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${inertiaSystem.enabled ? theme.colors.primary : theme.colors.surfaceLight}60`,
              zIndex: 300,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              pointerEvents: 'auto'
            }}
            title={inertiaSystem.enabled ? 'Désactiver l\'inertie' : 'Activer l\'inertie'}
          >
            🌀
          </button>
          
          <div style={{
            position: 'fixed',
            bottom: '0.5rem',
            right: '0.5rem',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            zIndex: 301,
            pointerEvents: 'none'
          }}>
            Inertia: {inertiaSystem.enabled ? 'ON' : 'OFF'}
          </div>
        </div>
      )}

      {/* SLIDER DE FRICTION */}
      {isPlaying && inertiaSystem.enabled && sensorsEnabled && (
        <div style={{
          position: 'fixed',
          bottom: '7rem',
          right: '2rem',
          width: '3rem',
          height: '16rem',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          borderRadius: '1.5rem',
          padding: '1.5rem 0.75rem',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${theme.colors.primary}`,
          zIndex: 500,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          pointerEvents: 'auto'
        }}>
          <div style={{
            color: 'white',
            fontSize: '0.8rem',
            textAlign: 'center',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}>
            Friction
          </div>
          
          <div 
            style={{
              position: 'relative',
              width: '1.5rem',
              height: '12rem',
              backgroundColor: `${theme.colors.surfaceLight}80`,
              borderRadius: '0.75rem',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top;
              const fraction = Math.max(0, Math.min(1, y / rect.height));
              const newFriction = (1 - fraction) * 0.15;
              updateFriction(newFriction);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchMove={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const touch = e.touches[0];
              const y = touch.clientY - rect.top;
              const fraction = Math.max(0, Math.min(1, y / rect.height));
              const newFriction = (1 - fraction) * 0.15;
              updateFriction(newFriction);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              bottom: 0,
              width: '4px',
              backgroundColor: `${theme.colors.primary}50`,
              borderRadius: '2px',
              transform: 'translateX(-50%)'
            }} />
            
            <div style={{
              position: 'absolute',
              left: '50%',
              top: `${(1 - (inertiaSystem.friction / 0.15)) * 100}%`,
              transform: 'translateX(-50%) translateY(-50%)',
              width: '1.25rem',
              height: '0.75rem',
              backgroundColor: theme.colors.primary,
              borderRadius: '0.375rem',
              border: '2px solid white',
              pointerEvents: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }} />
          </div>
          
          <div style={{
            color: theme.colors.primary,
            fontSize: '0.7rem',
            textAlign: 'center',
            fontFamily: 'monospace',
            fontWeight: 'bold'
          }}>
            {(inertiaSystem.friction * 1000).toFixed(0)}
          </div>
        </div>
      )}

      {/* Popup Sauvegarde Preset */}
      {showSavePreset && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 400
        }}>
          <div style={{
            background: theme.colors.surface,
            backdropFilter: 'blur(40px)',
            border: `1px solid ${theme.colors.surfaceLight}`,
            borderRadius: '1.5rem',
            padding: '3rem 2.5rem',
            minWidth: '400px',
            maxWidth: '90vw',
            boxShadow: `0 25px 50px -12px ${theme.colors.background}CC`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2.5rem'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.5rem',
                fontWeight: '600',
                color: theme.colors.text
              }}>
                💾 Sauvegarder Preset
              </h2>
              <button
                onClick={() => {
                  setShowSavePreset(false);
                  setNewPresetName('');
                }}
                style={{
                  background: `${theme.colors.surfaceLight}50`,
                  border: `1px solid ${theme.colors.surfaceLight}`,
                  borderRadius: '0.5rem',
                  color: theme.colors.textMuted,
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  color: theme.colors.text,
                  marginBottom: '0.75rem',
                  fontWeight: '500'
                }}>
                  Nom du preset
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Mon super preset..."
                  style={{
                    width: '100%',
                    backgroundColor: `${theme.colors.background}CC`,
                    border: `1px solid ${theme.colors.surfaceLight}`,
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    color: theme.colors.text,
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newPresetName.trim()) {
                      savePreset(newPresetName.trim());
                    }
                  }}
                />
              </div>

              <div style={{
                padding: '1rem',
                backgroundColor: `${theme.colors.primary}20`,
                border: `1px solid ${theme.colors.primary}`,
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                color: theme.colors.primary
              }}>
                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                  📋 Contenu à sauvegarder :
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  • {midiMappings.length} mappings MIDI
                  <br />
                  • Configuration des capteurs
                  <br />
                  • Paramètres min/max personnalisés
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    setShowSavePreset(false);
                    setNewPresetName('');
                  }}
                  style={{
                    flex: 1,
                    padding: '1rem 2rem',
                    background: `${theme.colors.surfaceLight}CC`,
                    color: theme.colors.textMuted,
                    border: `1px solid ${theme.colors.surfaceLight}`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  Annuler
                </button>
                
                <button
                  onClick={() => savePreset(newPresetName.trim())}
                  disabled={!newPresetName.trim()}
                  style={{
                    flex: 1,
                    padding: '1rem 2rem',
                    background: newPresetName.trim() ? theme.gradients.primary : `${theme.colors.surfaceLight}50`,
                    color: 'white',
                    border: `1px solid ${newPresetName.trim() ? theme.colors.primary : theme.colors.surfaceLight}60`,
                    borderRadius: '0.75rem',
                    fontSize: '1rem',
                    cursor: newPresetName.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                    boxShadow: newPresetName.trim() ? `0 4px 15px ${theme.colors.primary}40` : 'none',
                    opacity: newPresetName.trim() ? 1 : 0.6
                  }}
                >
                  💾 Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Notes MIDI */}
      {showMidiNotes && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 400,
          padding: '1rem'
        }}>
          <div style={{
            background: theme.colors.surface,
            backdropFilter: 'blur(40px)',
            border: `1px solid ${theme.colors.surfaceLight}`,
            borderRadius: '1.5rem',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '95vw',
            height: '90vh',
            boxShadow: `0 25px 50px -12px ${theme.colors.background}CC`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  color: theme.colors.text,
                  fontWeight: '500'
                }}>
                  Canal:
                </label>
                <select
                  value={midiChannel}
                  onChange={(e) => setMidiChannel(parseInt(e.target.value))}
                  style={{
                    backgroundColor: `${theme.colors.background}CC`,
                    border: `1px solid ${theme.colors.surfaceLight}`,
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    color: theme.colors.text,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    outline: 'none',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {Array.from({ length: 16 }, (_, i) => (
                    <option key={i + 1} value={i + 1} style={{ backgroundColor: theme.colors.surface }}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowMidiNotes(false)}
                style={{
                  background: `${theme.colors.surfaceLight}50`,
                  border: `1px solid ${theme.colors.surfaceLight}`,
                  borderRadius: '0.5rem',
                  color: theme.colors.textMuted,
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  width: '2rem',
                  height: '2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                ✕
              </button>
            </div>

            {/* Grille de notes MIDI */}
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.75rem',
                flex: 1,
                overflowY: 'auto',
                padding: '0.5rem',
                scrollBehavior: 'smooth'
              }}
            >
              {midiNotes.map(({ note, name }) => {
                const isPressed = pressedNotes.has(note);
                const isLastPlayed = lastPlayedNote === note;
                
                return (
                  <button
                    key={note}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleNotePress(note, name);
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      handleNoteRelease(note);
                    }}
                    onMouseLeave={(e) => {
                      e.preventDefault();
                      if (isPressed) handleNoteRelease(note);
                    }}
                    onTouchStart={(e) => {
                      const startTime = Date.now();
                      const startY = e.touches[0].clientY;
                      
                      const handleTouchEnd = (endEvent) => {
                        endEvent.preventDefault();
                        const endTime = Date.now();
                        const endY = endEvent.changedTouches[0].clientY;
                        const deltaTime = endTime - startTime;
                        const deltaY = Math.abs(endY - startY);
                        
                        // Si c'est un tap rapide sans mouvement significatif, jouer la note
                        if (deltaTime < 200 && deltaY < 10) {
                          handleNotePress(note, name);
                          setTimeout(() => handleNoteRelease(note), 100);
                        }
                        
                        document.removeEventListener('touchend', handleTouchEnd);
                      };
                      
                      document.addEventListener('touchend', handleTouchEnd);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '6rem',
                      borderRadius: '1rem',
                      border: `2px solid ${theme.colors.surfaceLight}`,
                      background: isLastPlayed
                        ? theme.gradients.accent
                        : theme.gradients.surface,
                      color: isLastPlayed ? 'white' : theme.colors.text,
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.15s ease-out',
                      transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                      boxShadow: isLastPlayed 
                        ? `0 4px 15px ${theme.colors.secondary}60, inset 0 2px 4px rgba(0, 0, 0, 0.2)` 
                        : `0 2px 8px ${theme.colors.background}40`,
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold',
                      textShadow: isLastPlayed ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                    }}>
                      {name}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      opacity: 0.8,
                      fontFamily: 'monospace',
                      textShadow: isLastPlayed ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
                    }}>
                      {note}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Animation CSS pour le pulse */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SensorMidiController;