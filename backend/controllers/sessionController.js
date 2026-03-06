import { Session } from '../models/session.js';

// Get all available sessions (system + user's own)
export const getSessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            $or: [
                { type: 'system', isActive: true },
                { type: 'user', createdBy: req.user._id }
            ]
        }).populate('createdBy', 'fullName username').sort({ type: 1, name: 1 });

        res.json(sessions);
    } catch (error) {
        console.error('Get Sessions Error:', error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};

// Create a session
export const createSession = async (req, res) => {
    try {
        const { name, emoji, youtubePlaylistUrl, quotes, quoteInterval } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Session name is required' });
        }

        const isAdmin = req.user.role === 'admin';

        const session = new Session({
            name: name.trim(),
            emoji: emoji || '🎵',
            createdBy: req.user._id,
            type: isAdmin ? 'system' : 'user',
            youtubePlaylistUrl: youtubePlaylistUrl || '',
            quotes: quotes || [],
            quoteInterval: quoteInterval || 20
        });

        await session.save();
        await session.populate('createdBy', 'fullName username');

        res.status(201).json(session);
    } catch (error) {
        console.error('Create Session Error:', error);
        res.status(500).json({ message: 'Error creating session' });
    }
};

// Update a session
export const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, emoji, youtubePlaylistUrl, quotes, quoteInterval, isActive } = req.body;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Admin can edit system sessions, users can only edit their own
        const isAdmin = req.user.role === 'admin';
        if (session.type === 'system' && !isAdmin) {
            return res.status(403).json({ message: 'Only admins can edit system sessions' });
        }
        if (session.type === 'user' && session.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own sessions' });
        }

        if (name !== undefined) session.name = name.trim();
        if (emoji !== undefined) session.emoji = emoji;
        if (youtubePlaylistUrl !== undefined) session.youtubePlaylistUrl = youtubePlaylistUrl;
        if (quotes !== undefined) session.quotes = quotes;
        if (quoteInterval !== undefined) session.quoteInterval = quoteInterval;
        if (isActive !== undefined && isAdmin) session.isActive = isActive;

        await session.save();
        await session.populate('createdBy', 'fullName username');

        res.json(session);
    } catch (error) {
        console.error('Update Session Error:', error);
        res.status(500).json({ message: 'Error updating session' });
    }
};

// Delete a session
export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;

        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const isAdmin = req.user.role === 'admin';
        if (session.type === 'system' && !isAdmin) {
            return res.status(403).json({ message: 'Only admins can delete system sessions' });
        }
        if (session.type === 'user' && session.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only delete your own sessions' });
        }

        await Session.findByIdAndDelete(id);
        res.json({ message: 'Session deleted' });
    } catch (error) {
        console.error('Delete Session Error:', error);
        res.status(500).json({ message: 'Error deleting session' });
    }
};
