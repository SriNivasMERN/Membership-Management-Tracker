import React from 'react';
import { motion } from 'framer-motion';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PlaceIcon from '@mui/icons-material/Place';
import { alpha, useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import fitnessIllustration from '../../assets/fitness-illustration.svg';
import fdsLogo from '../../assets/fds-logo.svg';

const drawerWidthExpanded = 220;
const drawerWidthCollapsed = 76;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, roles: ['ADMIN', 'STAFF', 'VIEWER'] },
  { label: 'Members', path: '/members', icon: <PeopleIcon />, roles: ['ADMIN', 'STAFF', 'VIEWER'] },
  { label: 'Configuration', path: '/configuration', icon: <SettingsIcon />, roles: ['ADMIN'] },
  { label: 'Users', path: '/users', icon: <AccountCircleIcon />, roles: ['ADMIN'] },
];

function MainLayout({ children, appearance = 'conservative' }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [drawerCollapsed, setDrawerCollapsed] = React.useState(false);
  const [logoError, setLogoError] = React.useState(false);
  const [menuImageError, setMenuImageError] = React.useState(false);
  const [fallbackImageError, setFallbackImageError] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, loading } = useSettings();
  const { user, logout } = useAuth();

  // Reset logo error when logoUrl changes
  React.useEffect(() => {
    setLogoError(false);
  }, [settings?.logoUrl]);
  React.useEffect(() => {
    setMenuImageError(false);
  }, [settings?.menuImageUrl]);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };
  const handleCollapseToggle = () => {
    setDrawerCollapsed((prev) => !prev);
  };

  const businessName =
    loading || !settings ? 'Membership Management Tracker' : settings.businessName;
  const logoUrl = settings?.logoUrl;
  const menuImageUrl = settings?.menuImageUrl;
  const defaultMenuImageUrl =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoPeJ--akqtKBkCxznw9SxWHQ0JTADOiX0Hg&s';
  const branchName = loading || !settings ? 'Main Branch' : settings.branchName || 'Main Branch';
  const visibleNavItems = navItems.filter((item) =>
    !item.roles || item.roles.includes(user?.role)
  );
  const appearanceTokens =
    appearance === 'energetic'
      ? {
          accent1: '#5f7a61',
          accent2: '#8c6a43',
          brandGlowA: 'rgba(95, 122, 97, 0.38)',
          brandGlowB: 'rgba(140, 106, 67, 0.34)',
          textPrimary: '#111827',
          textSecondary: '#374151',
          surface: 'rgba(255, 255, 255, 0.76)',
          surfaceAlt: 'rgba(245, 250, 242, 0.78)',
          surfaceBorder: 'rgba(95, 122, 97, 0.24)',
          drawerBgTop: 'rgba(236, 243, 232, 0.78)',
          drawerBgBottom: 'rgba(229, 237, 225, 0.78)',
          appBarBg: 'rgba(255, 255, 255, 0.72)',
          pageBg: '#e8eee6',
          pageTint: 'rgba(95, 122, 97, 0.08)',
          navDefault: '#111827',
          navHover: '#0b1220',
          navActiveBg: 'rgba(95, 122, 97, 0.2)',
          navActiveBorder: 'rgba(95, 122, 97, 0.34)',
          blur: 14,
          saturate: 130,
          patternOpacity: 0.06,
          shadow: '0 12px 26px rgba(39, 51, 40, 0.14)',
        }
      : {
          accent1: theme.palette.primary.main,
          accent2: theme.palette.secondary.main,
          brandGlowA: alpha(theme.palette.primary.main, 0.28),
          brandGlowB: alpha(theme.palette.secondary.main, 0.28),
          textPrimary: theme.palette.text.primary,
          textSecondary: theme.palette.text.secondary,
          surface: 'rgba(255, 255, 255, 0.76)',
          surfaceAlt: 'rgba(245, 250, 242, 0.78)',
          surfaceBorder: 'rgba(95, 122, 97, 0.24)',
          drawerBgTop: 'rgba(236, 243, 232, 0.78)',
          drawerBgBottom: 'rgba(229, 237, 225, 0.78)',
          appBarBg: 'rgba(255, 255, 255, 0.72)',
          pageBg: '#e8eee6',
          pageTint: alpha(theme.palette.secondary.main, 0.08),
          navDefault: theme.palette.text.primary,
          navHover: '#0b1220',
          navActiveBg: alpha(theme.palette.primary.main, 0.2),
          navActiveBorder: alpha(theme.palette.primary.main, 0.34),
          blur: 14,
          saturate: 130,
          patternOpacity: 0.06,
          shadow: '0 12px 26px rgba(39, 51, 40, 0.14)',
        };

  const AnimatedFitnessLogo = () => (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: '50px',
        height: '50px',
      }}
    >
      {/* SVG Fitness Icon - Clearly a dumbbell */}
      <motion.svg
        width="50"
        height="50"
        viewBox="0 0 50 50"
        initial={reduceMotion ? undefined : { rotate: 0 }}
        animate={reduceMotion ? undefined : { rotate: [0, 3, -3, 0] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }
        }
        style={{ filter: `drop-shadow(0 0 4px ${appearanceTokens.brandGlowA})` }}
      >
        {/* Left weight plate */}
        <motion.rect
          x="5"
          y="15"
          width="8"
          height="20"
          rx="2"
          fill="url(#gradient1)"
          animate={reduceMotion ? undefined : { scaleY: [1, 1.06, 1] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0 }
          }
        />
        {/* Center bar */}
        <motion.rect
          x="13"
          y="22"
          width="24"
          height="6"
          rx="3"
          fill="url(#gradient2)"
          animate={reduceMotion ? undefined : { scaleX: [1, 1.03, 1] }}
          transition={
            reduceMotion ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
          }
        />
        {/* Right weight plate */}
        <motion.rect
          x="37"
          y="15"
          width="8"
          height="20"
          rx="2"
          fill="url(#gradient1)"
          animate={reduceMotion ? undefined : { scaleY: [1, 1.06, 1] }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }
          }
        />
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={appearanceTokens.accent1} />
            <stop offset="100%" stopColor={appearanceTokens.accent2} />
          </linearGradient>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={appearanceTokens.accent1} />
            <stop offset="50%" stopColor={appearanceTokens.accent2} />
            <stop offset="100%" stopColor={appearanceTokens.accent1} />
          </linearGradient>
        </defs>
        {/* Glow effect */}
        <motion.circle
          cx="25"
          cy="25"
          r="22"
          fill="none"
          stroke="url(#gradient1)"
          strokeWidth="1"
          opacity="0.3"
          animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.2, 0, 0.2] }}
          transition={
            reduceMotion ? undefined : { duration: 3, repeat: Infinity, ease: 'easeOut' }
          }
        />
      </motion.svg>
    </motion.div>
  );

  const BusinessBrand = () => (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.2,
          px: 1.5,
          py: 0.55,
          borderRadius: 2.5,
          background: 'rgba(255, 255, 255, 0.96)',
          border: `1px solid ${alpha(appearanceTokens.accent1, 0.28)}`,
          boxShadow: `0 6px 14px ${alpha(appearanceTokens.accent1, 0.14)}`,
          maxWidth: { xs: '78vw', sm: '58vw', md: '520px' },
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            height: 44,
            width: 72,
            borderRadius: 1.5,
            overflow: 'hidden',
            flexShrink: 0,
            background: '#ffffff',
            border: `1px solid ${alpha(appearanceTokens.accent1, 0.35)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logoUrl && !logoError ? (
            <Box
              component="img"
              src={logoUrl}
              alt={businessName}
              onError={() => setLogoError(true)}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                transform: 'scale(1.35)',
                transformOrigin: 'center',
              }}
            />
          ) : !fallbackImageError ? (
            <Box
              component="img"
              src={fdsLogo}
              alt="FDS logo"
              onError={() => setFallbackImageError(true)}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              component="img"
              src={fitnessIllustration}
              alt="Fitness fallback logo"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: 'scale(1.08)',
                transformOrigin: 'center',
              }}
            />
          )}
        </Box>
        <Typography
          variant="h6"
          component="span"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '0.84rem', sm: '0.95rem' },
            letterSpacing: '0.02em',
            color: '#1f2937',
            fontFamily: '"Plus Jakarta Sans", "Sora", "Manrope", system-ui, sans-serif',
            maxWidth: { xs: '50vw', sm: '34vw', md: '300px' },
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {businessName}
        </Typography>
      </Box>
    </motion.div>
  );

  const drawer = (
    <Box
      onClick={handleDrawerToggle}
      sx={{
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        pt: 7,
        color: appearanceTokens.textSecondary,
        background: `linear-gradient(180deg, ${appearanceTokens.drawerBgTop} 0%, ${appearanceTokens.drawerBgBottom} 100%)`,
        borderRight: `1px solid ${appearanceTokens.surfaceBorder}`,
        position: 'relative',
        backdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
        WebkitBackdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 96,
          bottom: 96,
          left: 0,
          width: 3,
          borderRadius: 2,
          background: `linear-gradient(180deg, ${appearanceTokens.accent1}, ${appearanceTokens.accent2})`,
          opacity: 0.6,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          p: 1,
          borderRadius: 2,
          background: appearanceTokens.surfaceAlt,
          border: `1px solid ${appearanceTokens.surfaceBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerCollapsed ? 'center' : 'flex-start',
          textAlign: 'left',
          zIndex: 1,
        }}
      >
        <PlaceIcon sx={{ fontSize: 18, color: appearanceTokens.navDefault }} />
        {!drawerCollapsed && (
          <Typography
            variant="body2"
            sx={{ color: appearanceTokens.textPrimary, fontWeight: 600, ml: 1 }}
          >
            {branchName}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1, zIndex: 1 }}>
        <IconButton
          aria-label={drawerCollapsed ? 'Expand menu' : 'Collapse menu'}
          onClick={(e) => {
            e.stopPropagation();
            handleCollapseToggle();
          }}
          sx={{
            color: appearanceTokens.navDefault,
            background: appearanceTokens.surfaceAlt,
            border: `1px solid ${appearanceTokens.surfaceBorder}`,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
            '&:hover': {
              background: appearanceTokens.surface,
              borderColor: 'rgba(0, 0, 0, 0.18)',
            },
          }}
        >
          {drawerCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>
      <List sx={{ px: 1 }}>
        {visibleNavItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1,
                borderRadius: 2,
                mx: 1,
                color: appearanceTokens.navDefault,
                '& .MuiSvgIcon-root': {
                  color: appearanceTokens.navDefault,
                },
                '&.Mui-selected': {
                  background: appearanceTokens.navActiveBg,
                  border: `1px solid ${appearanceTokens.navActiveBorder}`,
                  '&:hover': {
                    background: appearanceTokens.navActiveBg,
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: appearanceTokens.textPrimary,
                  },
                  '& .MuiSvgIcon-root': {
                    color: appearanceTokens.textPrimary,
                  },
                },
                '&:hover': {
                  background: appearanceTokens.surfaceAlt,
                  '& .MuiListItemText-primary': {
                    color: appearanceTokens.navHover,
                  },
                  '& .MuiSvgIcon-root': {
                    color: appearanceTokens.navHover,
                  },
                  animation: reduceMotion ? 'none' : 'hoverZoomOutIn 3s ease-in-out infinite',
                },
                transition: 'all 0.2s ease',
                '&:focus-visible': {
                  outline: `2px solid ${appearanceTokens.accent1}`,
                  outlineOffset: 2,
                },
              }}
            >
              {item.icon}
              {!drawerCollapsed && (
                <ListItemText
                  primary={item.label}
                  sx={{ ml: 1.5 }}
                  primaryTypographyProps={{ color: appearanceTokens.navDefault, fontWeight: 700 }}
                />
              )}
            </ListItemButton>
          </motion.div>
        ))}
      </List>
      <Box
        sx={{
          mt: 'auto',
          px: 2,
          pb: 3,
          flexGrow: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          height: 300,
          pt: 1,
        }}
      >
        {!drawerCollapsed && (
          <Box
            component="img"
            src={menuImageUrl && !menuImageError ? menuImageUrl : defaultMenuImageUrl}
            alt="Wellness illustration"
            onError={() => setMenuImageError(true)}
            sx={{
              width: '100%',
              height: '100%',
              maxWidth: 220,
              maxHeight: 300,
              objectFit: 'cover',
              objectPosition: 'top center',
              transform: 'translateY(-20%)',
              borderRadius: 3,
              opacity: 0.95,
              border: `1px solid ${appearanceTokens.surfaceBorder}`,
              boxShadow: '0 16px 28px rgba(15, 23, 42, 0.12)',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", "Sora", "Manrope", system-ui, sans-serif',
        color: appearanceTokens.textPrimary,
        background: `
          linear-gradient(180deg, ${appearanceTokens.pageBg} 0%, ${appearanceTokens.pageBg} 100%)
        `,
        position: 'relative',
        backgroundSize: '100% 100%',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 30% 10%, ${alpha(appearanceTokens.accent2, 0.03)} 0%, transparent 45%),
            radial-gradient(circle at 80% 90%, ${alpha(appearanceTokens.accent1, 0.03)} 0%, transparent 45%)
          `,
          backgroundSize: '100% 100%, 100% 100%',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: appearanceTokens.patternOpacity,
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          pointerEvents: 'none',
          zIndex: 0,
        },
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          background: appearanceTokens.appBarBg,
          borderBottom: `1px solid ${appearanceTokens.surfaceBorder}`,
          boxShadow: appearanceTokens.shadow,
          color: appearanceTokens.textPrimary,
          backdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
          WebkitBackdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
          '&::after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: `linear-gradient(90deg, ${appearanceTokens.accent1}, ${appearanceTokens.accent2})`,
            opacity: 0.35,
          },
        }}
      >
        <Toolbar
          sx={{
            position: 'relative',
            minHeight: { xs: 72, sm: 64 },
            pl: isMobile ? 7 : undefined,
          }}
        >
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                position: 'absolute',
                left: 8,
                zIndex: 3,
                color: appearanceTokens.navDefault,
                background: appearanceTokens.surface,
                border: `1px solid ${appearanceTokens.surfaceBorder}`,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  background: appearanceTokens.surfaceAlt,
                  borderColor: 'rgba(0, 0, 0, 0.18)',
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              background: appearanceTokens.surfaceAlt,
              border: `1px solid ${appearanceTokens.surfaceBorder}`,
              mr: 2,
            }}
          >
            <PlaceIcon sx={{ fontSize: 18, color: appearanceTokens.navDefault }} />
            <Typography variant="body2" sx={{ color: appearanceTokens.textPrimary, fontWeight: 600 }}>
              {branchName}
            </Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              px: 1,
              pt: { xs: 1, sm: 0 },
            }}
          >
            {isMobile ? (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: appearanceTokens.textPrimary,
                  fontSize: '0.95rem',
                  textAlign: 'center',
                  maxWidth: '58vw',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {businessName}
              </Typography>
            ) : (
              <BusinessBrand />
            )}
          </Box>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1,
              pr: 1,
            }}
          >
            <IconButton
              color="inherit"
              aria-label="Logout"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              sx={{
                color: appearanceTokens.navDefault,
                background: appearanceTokens.surface,
                border: `1px solid ${appearanceTokens.surfaceBorder}`,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
                '&:hover': {
                  background: appearanceTokens.surfaceAlt,
                  borderColor: 'rgba(0, 0, 0, 0.18)',
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { sm: drawerCollapsed ? drawerWidthCollapsed : drawerWidthExpanded },
          flexShrink: { sm: 0 },
          zIndex: 1,
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidthExpanded,
                background: `linear-gradient(180deg, ${appearanceTokens.drawerBgTop} 0%, ${appearanceTokens.drawerBgBottom} 100%)`,
                borderRight: `1px solid ${appearanceTokens.surfaceBorder}`,
                boxShadow: appearanceTokens.shadow,
                backdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
                WebkitBackdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerCollapsed ? drawerWidthCollapsed : drawerWidthExpanded,
                background: `linear-gradient(180deg, ${appearanceTokens.drawerBgTop} 0%, ${appearanceTokens.drawerBgBottom} 100%)`,
                borderRight: `1px solid ${appearanceTokens.surfaceBorder}`,
                boxShadow: appearanceTokens.shadow,
                backdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
                WebkitBackdropFilter: `blur(${appearanceTokens.blur}px) saturate(${appearanceTokens.saturate}%)`,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          mt: 8,
          width: {
            sm: `calc(100% - ${
              drawerCollapsed ? drawerWidthCollapsed : drawerWidthExpanded
            }px)`,
          },
          position: 'relative',
          zIndex: 1,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default MainLayout;

