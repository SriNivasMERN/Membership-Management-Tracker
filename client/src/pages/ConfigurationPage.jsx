import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import SettingsTab from './config/SettingsTab.jsx';
import PlansTab from './config/PlansTab.jsx';
import SlotsTab from './config/SlotsTab.jsx';
import PricingRulesTab from './config/PricingRulesTab.jsx';

function ConfigurationPage() {
  const [tab, setTab] = useState(0);

  return (
    <motion.div
      key="configuration"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Box mb={2}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: '#1f2422',
            letterSpacing: 0.2,
            fontFamily: '"Fraunces", "IvyMode", "Merriweather", "Georgia", serif',
          }}
        >
          Configuration
        </Typography>
      </Box>
      <Paper>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Business Settings" />
          <Tab label="Plans" />
          <Tab label="Slots" />
          <Tab label="Pricing Rules" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {tab === 0 && <SettingsTab />}
          {tab === 1 && <PlansTab />}
          {tab === 2 && <SlotsTab />}
          {tab === 3 && <PricingRulesTab />}
        </Box>
      </Paper>
    </motion.div>
  );
}

export default ConfigurationPage;

