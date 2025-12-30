// This file is no longer used - see videoQueries.ts and commentQueries.ts instead
// Keeping for backwards compatibility but deprecated

import { 
  fetchVideos, 
  updateVideo, 
  deleteVideo 
} from './videoQueries';

import { 
  fetchRecentComments, 
  moderateComment, 
  deleteComment 
} from './commentQueries';

export { 
  fetchVideos, 
  updateVideo, 
  deleteVideo,
  fetchRecentComments,
  moderateComment,
  deleteComment,
};
