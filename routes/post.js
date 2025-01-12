const { Router } = require('express');
const auth = require('../middleware/auth');
const adminGuard = require('../middleware/adminGuard');
const {
  createPost,
  updatePost,
  getPosts,
  likePost,
  checkLike,
  getAllLikes,
  unlikePost,
  deletePost,
  getPostById,
  createMoviePost,
  patchPost,
} = require('../controllers/post');

const postRouter = Router();
postRouter.get('/', getPosts);
postRouter.get('/:postId', getPostById);
postRouter.post('/movie', createMoviePost);
// endpoints before this line is open to everyone
postRouter.use(auth);
// endpoints after this line require valid token to access

postRouter.patch('/:postId', patchPost);

postRouter.post('/post', createPost);
postRouter.patch('/admin/:postId', adminGuard, deletePost);
postRouter.put('/:postId', updatePost);

postRouter.patch('/like/:postId', auth, likePost);
postRouter.patch('/unlike/:postId', auth, unlikePost);

postRouter.get('/:postId/likes/', auth, getAllLikes);
postRouter.get('/:postId/likes/:userId', auth, checkLike);

module.exports = postRouter;
