import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { themes } from './theme';
import ParentalGate from './screens/ParentalGate';
import CreateProfile from './screens/CreateProfile';
import WhoIsPlaying from './screens/WhoIsPlaying';
import HomeHub from './screens/HomeHub';
import SubjectTopics from './screens/SubjectTopics';
import TopicActivities from './screens/TopicActivities';
import TopicActivity from './screens/TopicActivity';
import ParentDashboard from './screens/ParentDashboard';

function RootRedirect() {
  const { kids, activeKidId } = useApp();
  if (kids.length === 0) {
    return <Navigate to="/gate" replace state={{ next: '/create-profile' }} />;
  }
  if (!activeKidId) {
    return <Navigate to="/who" replace />;
  }
  return <Navigate to="/home" replace />;
}

export default function App() {
  const { theme } = useApp();
  const palette = themes[theme];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: palette.pageBg,
        transition: 'background 0.3s',
      }}
    >
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/gate" element={<ParentalGate />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/who" element={<WhoIsPlaying />} />
        <Route path="/home" element={<HomeHub />} />
        <Route path="/subject/:subjectId" element={<SubjectTopics />} />
        <Route path="/subject/:subjectId/topic/:topicId" element={<TopicActivities />} />
        <Route path="/subject/:subjectId/topic/:topicId/activity/:activityId" element={<TopicActivity />} />
        <Route path="/dashboard" element={<ParentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
