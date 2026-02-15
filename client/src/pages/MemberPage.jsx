import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import MemberList from '../components/members/MemberList.jsx';

function MemberPage() {
  return (
    <motion.div
      key="members"
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
          Members
        </Typography>
      </Box>
      <MemberList />
    </motion.div>
  );
}

export default MemberPage;

