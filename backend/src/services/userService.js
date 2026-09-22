// backend/src/services/userService.js (COMPLETE FIXED)

const userRepository = require('../repositories/userRepository');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');
const cloudinary = require('../config/cloudinary');

class UserService {
    async updateProfile(userId, data) {
        const { name, phone } = data;

        if (!name && !phone) {
            throw ApiError.badRequest('Name or phone is required');
        }

        // Phone validation (only if phone provided)
        if (phone) {
            const phoneRegex = /^(\+8801|01)[0-9]{9}$/;
            if (!phoneRegex.test(phone)) {
                throw ApiError.badRequest('Invalid Bangladesh phone number format (e.g., 01700000000)');
            }
        }

        const user = await userRepository.updateProfile(userId, { name, phone });
        return user;
    }

    // ✅ FIXED: Upload avatar from CloudinaryStorage (file.path already has URL)
    async uploadAvatar(userId, file) {
        if (!file) {
            throw ApiError.badRequest('Avatar file is required');
        }

        console.log('📤 Processing avatar upload...');
        console.log('📁 File info:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            hasPath: !!file.path,
            path: file.path,
            hasBuffer: !!file.buffer,
            bufferLength: file.buffer?.length || 0,
        });

        try {
            let avatarUrl;

            // ✅ Case 1: CloudinaryStorage already uploaded - file.path is URL
            if (file.path && (file.path.includes('cloudinary.com') || file.path.includes('res.cloudinary.com'))) {
                console.log('✅ File already uploaded by CloudinaryStorage');
                avatarUrl = file.path;
            }
            // ✅ Case 2: Local path - upload to Cloudinary
            else if (file.path) {
                console.log('📤 Uploading from local path:', file.path);
                
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'udrive-bangladesh/avatars',
                    public_id: `avatar_${userId.slice(0, 8)}_${Date.now()}`,
                    transformation: [
                        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' },
                    ],
                });
                
                avatarUrl = result.secure_url || result.url;
            }
            // ✅ Case 3: Buffer available - upload as data URI
            else if (file.buffer && file.buffer.length > 0) {
                console.log('📤 Uploading from buffer');
                
                const base64 = file.buffer.toString('base64');
                const dataURI = `data:${file.mimetype || 'image/jpeg'};base64,${base64}`;
                
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'udrive-bangladesh/avatars',
                    public_id: `avatar_${userId.slice(0, 8)}_${Date.now()}`,
                    transformation: [
                        { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                        { quality: 'auto' },
                    ],
                });
                
                avatarUrl = result.secure_url || result.url;
            }
            // ✅ Case 4: secure_url directly provided
            else if (file.secure_url) {
                avatarUrl = file.secure_url;
            }
            else {
                throw new Error('File path, buffer, and secure_url all missing');
            }

            console.log('✅ Avatar URL:', avatarUrl);

            // Update database
            await userRepository.updateAvatar(userId, avatarUrl);

            return avatarUrl;
        } catch (error) {
            console.error('❌ Avatar upload failed:', error.message);
            console.error('❌ Full error:', error);
            throw ApiError.badRequest('Failed to upload avatar: ' + error.message);
        }
    }

    // ✅ Simple method: Just update avatar URL
    async updateAvatarUrl(userId, avatarUrl) {
        if (!avatarUrl) {
            throw ApiError.badRequest('Avatar URL is required');
        }
        
        await userRepository.updateAvatar(userId, avatarUrl);
        return avatarUrl;
    }

    async changePassword(userId, currentPassword, newPassword) {
        if (!currentPassword || !newPassword) {
            throw ApiError.badRequest('Current and new password are required');
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=.,?]).{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            throw ApiError.badRequest(
                'Password must contain: 1 uppercase, 1 lowercase, 1 number, 1 special character, minimum 8 characters'
            );
        }

        if (currentPassword === newPassword) {
            throw ApiError.badRequest('New password must be different from current password');
        }

        const user = await userRepository.findById(userId);

        if (!user) {
            throw ApiError.notFound('User not found');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            throw ApiError.badRequest('Current password is incorrect');
        }

        const newHash = await bcrypt.hash(newPassword, 10);

        await userRepository.updatePassword(userId, newHash);
    }

    async deactivateAccount(userId) {
        await userRepository.deactivate(userId);
    }
}

module.exports = new UserService();