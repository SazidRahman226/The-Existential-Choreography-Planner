import mongoose from 'mongoose';
import { User } from '../models/user.js';
import { UserProfile } from '../models/userProfile.js';
import { Workflow } from '../models/workflow.js';
import { Task } from '../models/task.js';
import { Badge } from '../models/badge.js';
import { UserBadge } from '../models/userBadge.js';

async function verifyModels() {
    console.log('Verifying models...');

    // 1. User
    const user = new User({
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
    });
    try {
        await user.validate();
        console.log('✅ User model valid');
    } catch (err) {
        console.error('❌ User model invalid:', err.message);
    }

    // 2. Badge
    const badge = new Badge({
        name: 'First Step',
        iconUrl: 'http://example.com/icon.png',
        criteria: { type: 'first_login' },
        threshold: 1
    });
    try {
        await badge.validate();
        console.log('✅ Badge model valid');
    } catch (err) {
        console.error('❌ Badge model invalid:', err.message);
    }

    // 3. UserProfile
    const userProfile = new UserProfile({
        userId: user._id,
        badgeId: [badge._id]
    });
    try {
        await userProfile.validate();
        console.log('✅ UserProfile model valid');
    } catch (err) {
        console.error('❌ UserProfile model invalid:', err.message);
    }

    // 4. Workflow
    const workflow = new Workflow({
        owner: user._id,
        title: 'My First Workflow',
        status: 'active'
    });
    try {
        await workflow.validate();
        console.log('✅ Workflow model valid');
    } catch (err) {
        console.error('❌ Workflow model invalid:', err.message);
    }

    // 5. Task
    const task = new Task({
        workflowId: workflow._id,
        title: 'Task 1',
        status: 'pending',
        points: 10
    });
    try {
        await task.validate();
        console.log('✅ Task model valid');
    } catch (err) {
        console.error('❌ Task model invalid:', err.message);
    }

    // 6. UserBadge
    const userBadge = new UserBadge({
        userId: user._id,
        badgeId: badge._id
    });
    try {
        await userBadge.validate();
        console.log('✅ UserBadge model valid');
    } catch (err) {
        console.error('❌ UserBadge model invalid:', err.message);
    }

    console.log('Verification complete.');
    process.exit(0);
}

verifyModels();
