import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import api from '../../api/axiosClient.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import MemberFormDialog from './MemberFormDialog.jsx';

function MemberList() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/members', {
        params: { page: page + 1, limit: rowsPerPage, q: search || undefined },
      });
      setMembers(data.items);
      setTotalItems(data.pagination.totalItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, search]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setPage(0);
    setSearch(value.trim());
  };

  const openCreate = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleSaved = () => {
    loadMembers();
  };

  const handleDelete = async (member) => {
    const confirmed = window.confirm(
      `Delete ${memberLabel.toLowerCase()} "${member.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    await api.delete(`/members/${member._id}`);
    loadMembers();
  };

  const memberLabel = settings?.memberLabel || 'Member';
  const canWriteMembers = user?.role === 'ADMIN' || user?.role === 'STAFF';

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
    <Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}
      >
        <TextField
          size="small"
          placeholder="Search by name or mobile"
          value={search}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
          }}
        />
        <Box sx={{ flexGrow: 1 }} />
        {canWriteMembers ? (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            size="small"
          >{`Add ${memberLabel}`}</Button>
        ) : null}
      </Box>

      <Paper>
        <TableContainer>
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
                <TableCell>Fully Paid</TableCell>
                {canWriteMembers ? <TableCell align="right">Actions</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member, index) => (
                <TableRow key={member._id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.mobile}</TableCell>
                  <TableCell>{member.planSnapshot?.planName}</TableCell>
                  <TableCell>{member.slotSnapshot?.slotLabel}</TableCell>
                  <TableCell>{dayjs(member.startDate).format('YYYY-MM-DD')}</TableCell>
                  <TableCell>{dayjs(member.endDate).format('YYYY-MM-DD')}</TableCell>
                  <TableCell>{getStatusChip(member)}</TableCell>
                  <TableCell>
                    {member.fullyPaid ? (
                      <Chip label="Yes" size="small" color="primary" />
                    ) : (
                      <Chip label="No" size="small" />
                    )}
                  </TableCell>
                  {canWriteMembers ? (
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(member)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(member)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
              {!loading && members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canWriteMembers ? 10 : 9} align="center">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>

      {canWriteMembers ? (
        <MemberFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initialData={editingMember}
          onSaved={handleSaved}
        />
      ) : null}
    </Box>
  );
}

export default MemberList;

