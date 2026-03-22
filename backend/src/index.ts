import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';

// Import Routes
import { userRouter } from './api/routes/user.routes';
import { jobsRouter } from './api/routes/jobs.routes';
import { applicationsRouter } from './api/routes/applications.routes';

// Import Workers & Queues
import './agents/profileAgent';
import './agents/jobFinderAgent';
import './agents/jobMatcherAgent';
import './agents/applicationAgent';
import './agents/autoApplyAgent';
import { startScheduler } from './workers/scheduler';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, 
  legacyHeaders: false, 
});

app.use(cors());
app.use(express.json());
app.use(limiter);

// Set up routes
app.use('/api/users', userRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);

app.get('/health', (req, res) => res.json({ status: 'OK', agents: 'running' }));

app.listen(ENV.PORT, () => {
  console.log(`Server started on port ${ENV.PORT}`);
  
  // Start the background cron scheduler
  startScheduler();
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});
