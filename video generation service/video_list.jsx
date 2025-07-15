
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';

const VideoList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [deletingVideos, setDeletingVideos] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/short-videos');
      setVideos(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/create');
  };

  const handleVideoClick = (id) => {
    navigate(`/video/${id}`);
  };

  const handleDeleteVideo = (id, event) => {
    event.stopPropagation();
    setVideoToDelete(id);
    setOpenDialog(true);
  };

  const confirmDelete = async () => {
    if (videoToDelete) {
      setDeletingVideos(prev => [...prev, videoToDelete]);
      try {
        await axios.delete(`/api/short-video/${videoToDelete}`);
        fetchVideos();
      } catch (err) {
        if (err.response) {
          setError(`Failed to delete video: ${err.response.data.message || 'Server error'}`);
        } else {
          setError('Failed to delete video: Network error');
        }
        console.error('Error deleting video:', err);
      } finally {
        setDeletingVideos(prev => prev.filter(id => id !== videoToDelete));
        setOpenDialog(false);
        setVideoToDelete(null);
      }
    }
  };

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== 'string') return 'Unknown';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const filteredVideos = videos.filter(video =>
    video.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularRamProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth="md" mx="auto" py={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Your Videos
        </Typography>
        <TextField
          label="Search Videos"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create New Video
        </Button>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchVideos}
          sx={{ ml: 2 }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {filteredVideos.length === 0 ? (
        searchQuery ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
            No videos found matching "{searchQuery}"
          </Typography>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              You haven't created any videos yet.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              sx={{ mt: 2 }}
            >
              Create Your First Video
            </Button>
          </Paper>
        )
      ) : (
        <Paper>
          <List>
            {filteredVideos.map((video, index) => {
              const videoId = video?.id || '';
              const videoStatus = video?.status || 'unknown';

              return (
                <div key={videoId}>
                  {index > 0 && <Divider />}
                  <ListItem
                    button
                    onClick={() => handleVideoClick(videoId)}
                    sx={{
                      py: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Tooltip title={videoId}>
                          <span>Video {videoId.substring(0, 8)}...</span>
                        </Tooltip>
                      }
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          color={
                            videoStatus === 'ready' ? 'success.main' :
                            videoStatus === 'processing' ? 'info.main' :
                            videoStatus === 'failed' ? 'error.main' : 'text.secondary'
                          }
                        >
                          {capitalizeFirstLetter(videoStatus)}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      {videoStatus === 'ready' && (
                        <IconButton
                          edge="end"
                          aria-label="play"
                          onClick={() => handleVideoClick(videoId)}
                          color="primary"
                          title="Play video"
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      )}
                      {deletingVideos.includes(videoId) ? (
                        <CircularProgress size={24} />
                      ) : (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => handleDeleteVideo(videoId, e)}
                          color="error"
                          title="Delete video"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                </div>
              );
            })}
          </List>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this video?</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VideoList;
