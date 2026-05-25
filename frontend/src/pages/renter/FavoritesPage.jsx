import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { favoriteApi } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { RoomCard } from '../../components/RoomCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { springs } from '../../lib/animations';

function PulsingHeart() {
  return (
    <motion.div
      animate={{ scale: [1, 1.18, 1] }}
      transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
      className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/30"
    >
      <Heart className="h-8 w-8 fill-primary-500 text-primary-500" />
    </motion.div>
  );
}

export default function FavoritesPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    favoriteApi
      .getAll()
      .then((data) => {
        const arr = Array.isArray(data) ? data : (data?.content ?? data?.items ?? []);
        setPosts(arr);
      })
      .catch(() => toast.error('Không thể tải danh sách yêu thích.'))
      .finally(() => setLoading(false));
  }, []);

  const handleFavoriteChange = (postId, favorited) => {
    if (!favorited) {
      setPosts((prev) => prev.filter((p) => (p.postId ?? p.id) !== postId));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-50 mb-6">Phòng yêu thích</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} variant="card" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.smooth}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <PulsingHeart />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
            Chưa có phòng yêu thích
          </h3>
          <p className="mt-1.5 text-sm text-ink-600 dark:text-ink-200">
            Lưu những phòng bạn thích để xem lại sau.
          </p>
          <button
            type="button"
            onClick={() => navigate('/posts')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-700 text-white font-semibold text-sm transition-colors"
          >
            Tìm phòng ngay
          </button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {posts.map((post) => {
              const id = post.postId ?? post.id;
              return (
                <motion.div
                  key={id}
                  layout
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springs.smooth}
                  style={{ willChange: 'transform' }}
                >
                  <RoomCard
                    post={{ ...post, id }}
                    initialFavorited={true}
                    onFavoriteChange={handleFavoriteChange}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
