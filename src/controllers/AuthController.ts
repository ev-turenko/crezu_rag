import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';


export class AuthController {
    public static async confirmPasswordReset() {
        return async (req: AuthenticatedRequest, res: Response): Promise<any> => {
            try {
                const { newPassword, newPasswordConfirm, resetToken } = req.body;

                if( newPassword !== newPasswordConfirm) {
                    return res.status(400).json({
                        success: false,
                        message: 'New password and confirmation do not match'
                    });
                }

                if (!newPassword) {
                    return res.status(400).json({
                        success: false,
                        message: 'New password is required'
                    });
                }
                if (!resetToken) {
                    return res.status(400).json({
                        success: false,
                        message: 'Reset token is required'
                    });
                }

                await req.pbSuperAdmin!.collection('clients').confirmPasswordReset(
                    resetToken,
                    newPassword,
                    newPasswordConfirm,
                );

                return res.json({
                    success: true,
                    message: 'Password changed successfully',
                    data: null
                });
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    data: null,
                    message: 'Failed to confirm password reset',
                });
            }
        };
    }

    public async requestPasswordReset(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            const { email } = req.body;
            await req.pbSuperAdmin!.collection('clients').requestPasswordReset(email || req.user?.email || '');
            return res.status(200).json({
                success: true,
                message: 'If the email exists, a reset link has been sent',
                state: "reset_code",
                data: null
            });
        } catch (error: any) {
            console.error('Change password error:', error);
            if (error?.status === 400) {
                return res.status(400).json({
                    success: false,
                    message: 'Old password is incorrect' + `${error}`
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to change password',
                    error
                });
            }
        }
    }

    private static setAuthCookie(res: Response, token: string) {
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7,
            path: '/',
        });
    }

    public static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            const authData = await req.pb!.collection('clients').authWithPassword(email, password);

            this.setAuthCookie(res, authData.token);

            res.json({
                token: authData.token,
                user: {
                    id: authData.record.id,
                    email: authData.record.email,
                    name: authData.record.name,
                    last_name: authData.record.last_name,
                }
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }


    public static async refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                res.status(401).json({
                    success: false,
                    message: 'Token required'
                });
                return;
            }

            req.pb!.authStore.save(token, null);
            const authData = await req.pb!.collection('clients').authRefresh();

            if (!req.pb!.authStore.isValid || !req.pb!.authStore.record) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
                return;
            }

            res.json({
                success: true,
                data: {
                    token: authData.token,
                    user: authData.record
                }
            });
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(401).json({
                success: false,
                message: 'Token refresh failed'
            });
        }
    }

    public static async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<any> {
        try {
            const token = req.cookies?.auth_token;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token required'
                });
            }

            if (!req.pb) {
                return res.status(500).json({
                    success: false,
                    message: 'Database instance is not initialized'
                });
            }

            req.pb.authStore.save(token, null);
            await req.pb.collection('clients').authRefresh();

            if (!req.pb.authStore.isValid || !req.pb.authStore.record) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }

            return res.json({
                success: true,
                data: {
                    id: req.pb.authStore.record?.id,
                    name: req.pb.authStore.record?.name,
                    email: req.pb.authStore.record?.email
                }
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(401).json({
                success: false,
                message: 'Failed to get user data'
            });
        }
    }

    public static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { email, password, passwordConfirm, name, last_name } = req.body;

            await req.pb!.collection('clients').create({
                email,
                password,
                passwordConfirm,
                name,
                last_name,
                emailVisibility: true,
            });

            const authData = await req.pb!.collection('clients').authWithPassword(email, password);

            this.setAuthCookie(res, authData.token);

            res.json({
                token: authData.token,
                user: {
                    id: authData.record.id,
                    email: authData.record.email,
                    name: authData.record.name,
                    last_name: authData.record.last_name,
                }
            });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}