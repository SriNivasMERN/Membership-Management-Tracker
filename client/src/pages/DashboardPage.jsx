import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton as MuiIconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Chip,
  Skeleton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BoltIcon from '@mui/icons-material/Bolt';
import dayjs from 'dayjs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import api from '../api/axiosClient.js';
import { useSettings } from '../context/SettingsContext.jsx';
import MetricCard from '../components/common/MetricCard.jsx';

function DashboardPage() {
  const theme = useTheme();
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersPage, setMembersPage] = useState(0);
  const [membersRowsPerPage, setMembersRowsPerPage] = useState(10);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersTitle, setMembersTitle] = useState('');
  const [membersStatus, setMembersStatus] = useState('all');

  const loadSummary = async () => {
    setLoading(true);
    try {
      const result = await api.get('/dashboard/summary');
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const openMembersDialog = (title, status) => {
    setMembersTitle(title);
    setMembersStatus(status);
    setMembersPage(0);
    setMembersOpen(true);
  };

  const loadMembers = async (
    page = membersPage,
    limit = membersRowsPerPage,
    status = membersStatus
  ) => {
    setMembersLoading(true);
    try {
      const result = await api.get('/members', {
        params: {
          page: page + 1,
          limit,
          status,
        },
      });
      setMembers(result.items);
      setMembersTotal(result.pagination.totalItems);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (membersOpen) {
      loadMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersOpen, membersPage, membersRowsPerPage, membersStatus]);

  const isLoading = loading || !data;
  const stats = data?.stats || {
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    nearingExpiryMembers: 0,
    activeNowMembers: 0,
  };
  const revenue = data?.revenue || {
    currentMonth: 0,
    currentQuarter: 0,
    currentYear: 0,
  };
  const charts = data?.charts || {
    monthlyRevenueTrend: [],
    statusDistribution: { active: 0, expired: 0 },
  };

  const statusColors = [theme.palette.success.main, theme.palette.error.main];
  const statusData = [
    { name: 'Active', value: charts.statusDistribution.active },
    { name: 'Inactive', value: charts.statusDistribution.expired },
  ];
  const memberLabel = settings?.memberLabel || 'Member';

  const cardSx = {
    p: 2.25,
    borderRadius: 2,
    background: theme.palette.background.paper,
    border: `2px solid ${alpha(theme.palette.text.primary, 0.18)}`,
    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.08)',
    '&:hover': {
      animation: 'hoverZoomOutIn 450ms ease-in-out',
      boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&:hover': {
        animation: 'none',
      },
    },
  };
  const interactiveCardBoxSx = {
    cursor: 'pointer',
    borderRadius: 2,
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  };

  const getStatusChip = (member) => {
    const today = dayjs().startOf('day');
    const end = dayjs(member.endDate);
    const isActive = end.isSame(today, 'day') || end.isAfter(today, 'day');
    return (
      <Chip
        label={isActive ? 'Active' : 'Inactive'}
        size="small"
        color={isActive ? 'success' : 'default'}
      />
    );
  };

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Box display="flex" alignItems="center" mb={3}>
        <Typography
          variant="h4"
          sx={{
            flexGrow: 1,
            fontWeight: 800,
            color: 'text.primary',
            letterSpacing: 0.2,
            fontFamily: '"Fraunces", "IvyMode", "Merriweather", "Georgia", serif',
          }}
        >
          Dashboard
        </Typography>
        <IconButton
          onClick={loadSummary}
          size="small"
          sx={{
            color: 'text.secondary',
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
            '&:hover': {
              background: theme.palette.background.paper,
              borderColor: 'rgba(0, 0, 0, 0.18)',
              transform: 'rotate(180deg)',
              transition: 'transform 0.5s ease',
            },
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={2}>
        {/* Stat cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  sx={interactiveCardBoxSx}
                  onClick={() => openMembersDialog(`All ${memberLabel}s`, 'all')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openMembersDialog(`All ${memberLabel}s`, 'all');
                    }
                  }}
                >
                  <MetricCard
                    title={`Total ${memberLabel}s`}
                    subtitle="Overview"
                    value={stats.totalMembers}
                    icon={PeopleAltOutlinedIcon}
                    tone="neutral"
                    loading={isLoading}
                  />
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  sx={interactiveCardBoxSx}
                  onClick={() => openMembersDialog(`Active ${memberLabel}s`, 'active')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openMembersDialog(`Active ${memberLabel}s`, 'active');
                    }
                  }}
                >
                  <MetricCard
                    title="Active"
                    subtitle="Currently active"
                    value={stats.activeMembers}
                    icon={CheckCircleOutlineIcon}
                    tone="success"
                    loading={isLoading}
                  />
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  sx={interactiveCardBoxSx}
                  onClick={() => openMembersDialog(`Inactive ${memberLabel}s`, 'inactive')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openMembersDialog(`Inactive ${memberLabel}s`, 'inactive');
                    }
                  }}
                >
                  <MetricCard
                    title="Inactive"
                    subtitle="Not active"
                    value={stats.expiredMembers}
                    icon={CancelOutlinedIcon}
                    tone="error"
                    loading={isLoading}
                  />
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  sx={interactiveCardBoxSx}
                  onClick={() => openMembersDialog(`Nearing Expiry ${memberLabel}s`, 'nearing')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openMembersDialog(`Nearing Expiry ${memberLabel}s`, 'nearing');
                    }
                  }}
                >
                  <MetricCard
                    title="Nearing Expiry"
                    subtitle="Due soon"
                    value={stats.nearingExpiryMembers}
                    icon={AccessTimeIcon}
                    tone="warning"
                    loading={isLoading}
                  />
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  sx={interactiveCardBoxSx}
                  onClick={() => openMembersDialog(`Active Now ${memberLabel}s`, 'activeNow')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openMembersDialog(`Active Now ${memberLabel}s`, 'activeNow');
                    }
                  }}
                >
                  <MetricCard
                    title="Active Now"
                    subtitle="Active today"
                    value={stats.activeNowMembers}
                    icon={BoltIcon}
                    tone="info"
                    loading={isLoading}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Grid>

        {/* Revenue summary */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                Revenue (Fully Paid)
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              {isLoading ? (
                <>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={32} />
                </>
              ) : (
                <>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Current Month
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
                    >
                      ₹{revenue.currentMonth.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Current Quarter
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
                    >
                      ₹{revenue.currentQuarter.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      Current Year
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}
                    >
                      ₹{revenue.currentYear.toFixed(2)}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>
          </motion.div>
        </Grid>

        {/* Monthly revenue trend */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Paper sx={{ ...cardSx, height: 380 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                Monthly Revenue (Last 12 Months)
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={280} />
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <LineChart data={charts.monthlyRevenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="label" stroke={theme.palette.text.secondary} />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <Tooltip
                      contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                        color: theme.palette.text.primary,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      dot={{ fill: theme.palette.primary.main, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </motion.div>
        </Grid>

        {/* Active vs expired */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Paper sx={{ ...cardSx, height: 380 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
                Active vs Inactive
              </Typography>
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" height={280} />
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: theme.palette.text.secondary }}
                      formatter={(value) => (
                        <span style={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      <Dialog open={membersOpen} onClose={() => setMembersOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ pr: 5 }}>
          {membersTitle}
          <MuiIconButton
            aria-label="Close"
            onClick={() => setMembersOpen(false)}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'text.secondary',
              background: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.12)',
              '&:hover': {
                background: theme.palette.background.paper,
                borderColor: 'rgba(0, 0, 0, 0.18)',
              },
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </MuiIconButton>
        </DialogTitle>
        <DialogContent>
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>S.No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>{settings?.planLabel || 'Plan'}</TableCell>
                  <TableCell>{settings?.slotLabel || 'Slot'}</TableCell>
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member, index) => (
                  <TableRow key={member._id} hover>
                    <TableCell>{membersPage * membersRowsPerPage + index + 1}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.mobile}</TableCell>
                    <TableCell>{member.planSnapshot?.planName}</TableCell>
                    <TableCell>{member.slotSnapshot?.slotLabel}</TableCell>
                    <TableCell>{dayjs(member.startDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{dayjs(member.endDate).format('YYYY-MM-DD')}</TableCell>
                    <TableCell>{getStatusChip(member)}</TableCell>
                  </TableRow>
                ))}
                {!membersLoading && members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No {memberLabel.toLowerCase()}s found.
                    </TableCell>
                  </TableRow>
                )}
                {membersLoading && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={membersTotal}
            page={membersPage}
            onPageChange={(_, newPage) => setMembersPage(newPage)}
            rowsPerPage={membersRowsPerPage}
            onRowsPerPageChange={(e) => {
              setMembersRowsPerPage(parseInt(e.target.value, 10));
              setMembersPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default DashboardPage;
