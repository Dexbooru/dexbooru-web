import { BoolStrSchema } from '$lib/server/constants/reusableSchemas';
import { getApplicationConfigurationSync } from '$lib/server/applicationConfiguration';
import type { TRequestSchema } from '$lib/server/types/controllers';
import {
	ACCOUNT_DELETION_CONFIRMATION_TEXT,
	EMAIL_REQUIREMENTS,
	PASSWORD_REQUIREMENTS,
	USERNAME_REQUIREMENTS,
} from '$lib/shared/constants/auth';
import { TOTP_CODE_LENGTH } from '$lib/shared/constants/totp';
import { getEmailRequirements } from '$lib/shared/helpers/auth/email';
import { getPasswordRequirements } from '$lib/shared/helpers/auth/password';
import { getUsernameRequirements } from '$lib/shared/helpers/auth/username';
import { isFileImage } from '$lib/shared/helpers/images';
import { z } from 'zod';

const usernamePasswordFormSchema = z.object({
	username: z.string().trim().min(1, 'The username cannot be empty'),
	password: z.string().min(1, 'The password cannot be empty'),
	rememberMe: BoolStrSchema,
	redirectTo: z.string().optional(),
});
const usernamePasswordEndpointSchmea = z.object({
	username: z.string().trim().min(1, 'The username cannot be empty'),
	password: z.string().min(1, 'The password cannot be empty'),
});

const usernameRequirementSchema = z
	.string()
	.min(1, 'The username cannot be empty')
	.refine(
		(val) => {
			const { unsatisfied: usernameUnsatisfied } = getUsernameRequirements(val);
			return usernameUnsatisfied.length === 0;
		},
		{
			message: `The username did not meet the following requirements: ${Object.values(
				USERNAME_REQUIREMENTS,
			).join(', ')}`,
		},
	);

const passwordRequirementSchema = z
	.string()
	.min(1, 'The password cannot be empty')
	.refine(
		(val) => {
			const { unsatisfied: passwordUnsatisifed } = getPasswordRequirements(val);
			return passwordUnsatisifed.length === 0;
		},
		{
			message: `The password did not meet the following requirements: ${Object.values(
				PASSWORD_REQUIREMENTS,
			).join(', ')}`,
		},
	);

const profilePictureRefinementError = {
	message: `The provided file was either not in an image format or exceeded the maximum allowed size for a profile picture of: ${getApplicationConfigurationSync().maximumProfilePictureImageUploadSizeMb}`,
};

const emailRequirementSchema = z
	.string()
	.email()
	.trim()
	.transform((val) => val.toLocaleLowerCase())
	.refine(
		(val) => {
			const { unsatisfied: emailUnsatisfied } = getEmailRequirements(val);
			return emailUnsatisfied.length === 0;
		},
		{
			message: `The email did not meet the following requirements: ${Object.values(
				EMAIL_REQUIREMENTS,
			).join(', ')}`,
		},
	);

const UserRoleUpdateSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'The username cannot be empty'),
	}),
	body: z.object({
		newRole: z.enum(['OWNER', 'MODERATOR', 'USER']),
	}),
} satisfies TRequestSchema;

const UserGetTotpSchema = {
	pathParams: z.object({
		challengeId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const UserProcessTotpSchema = {
	form: z.object({
		otpCode: z.string().length(TOTP_CODE_LENGTH, {
			message: `The OTP code needs to be exactly ${TOTP_CODE_LENGTH} numeric digits long`,
		}),
		username: z.string().min(1, 'The username cannot be empty'),
		rememberMe: BoolStrSchema,
	}),
	pathParams: z.object({
		challengeId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const User2faEnableSchema = {
	form: z.object({
		password: z.string().min(1, 'The password cannot be empty').optional(),
		otpCode: z
			.string()
			.length(TOTP_CODE_LENGTH, {
				message: `The OTP code needs to be exactly ${TOTP_CODE_LENGTH} numeric digits long`,
			})
			.refine((val) => {
				const parsedCode = parseInt(val);
				return !isNaN(parsedCode);
			})
			.optional(),
	}),
} satisfies TRequestSchema;

const UserOtpGenerateSchema = {
	body: z.object({
		password: z.string().min(1, 'The password cannot be empty'),
	}),
} satisfies TRequestSchema;

const UserAuthEndpointSchema = {
	body: usernamePasswordEndpointSchmea,
} satisfies TRequestSchema;

const UserAuthFormSchema = {
	form: usernamePasswordFormSchema,
} satisfies TRequestSchema;

const UserCreateSchema = {
	form: z.object({
		username: usernameRequirementSchema,
		email: emailRequirementSchema,
		password: passwordRequirementSchema,
		confirmedPassword: z.string().min(1, 'The confirmed password cannot be empty'),
		profilePicture: z
			.instanceof(globalThis.File)
			.transform((val) => (val.size > 0 ? val : ''))
			.refine((val) => {
				if (typeof val === 'string') return true;

				const configuration = getApplicationConfigurationSync();
				const fileSizeMb = val.size / 1000 / 1000;
				return (
					isFileImage(val) && fileSizeMb <= configuration.maximumProfilePictureImageUploadSizeMb
				);
			}, profilePictureRefinementError),
	}),
} satisfies TRequestSchema;

const UserDeleteSchema = {
	form: z.object({
		deletionConfirmationText: z.literal(ACCOUNT_DELETION_CONFIRMATION_TEXT),
		confirmedPassword: z.string().min(1, 'The confirmed password cannot be empty'),
	}),
} satisfies TRequestSchema;

const UserChangeProfilePictureSchema = {
	form: z.object({
		newProfilePicture: z.instanceof(globalThis.File).refine((val) => {
			if (val.size === 0) return true;
			const configuration = getApplicationConfigurationSync();
			const fileSizeMb = val.size / 1000 / 1000;
			return isFileImage(val) && fileSizeMb <= configuration.maximumProfilePictureImageUploadSizeMb;
		}, profilePictureRefinementError),
		removeProfilePicture: BoolStrSchema,
	}),
} satisfies TRequestSchema;

const UserChangePasswordSchema = {
	form: z.object({
		oldPassword: z.string().min(1, 'The old password cannot be empty'),
		confirmedNewPassword: z.string().min(1, 'The confirmed new password cannot be empty'),
		newPassword: passwordRequirementSchema,
	}),
} satisfies TRequestSchema;

const UserChangeUsernameSchema = {
	form: z.object({
		newUsername: usernameRequirementSchema,
	}),
} satisfies TRequestSchema;

const GetUserSchema = {
	pathParams: z.object({
		username: z.string().min(1, 'The username cannot be empty'),
	}),
} satisfies TRequestSchema;

const UpdateUserPersonalPreferencesSchema = {
	form: z.object({
		autoBlurNsfw: BoolStrSchema.optional(),
		browseInSafeMode: BoolStrSchema.optional(),
		blacklistedTags: z
			.string()
			.transform((val) => val.toLocaleLowerCase().trim().split('\n'))
			.refine(
				(val) =>
					val.length <= getApplicationConfigurationSync().maximumBlacklistedTags &&
					val.every((tag) => tag.length <= getApplicationConfigurationSync().maximumTagLength),
				`The blacklisted tags exceed the maximum allowed length of ${getApplicationConfigurationSync().maximumTagLength} characters or the maximum allowed amount of ${getApplicationConfigurationSync().maximumBlacklistedTags} tags`,
			)
			.optional(),
		blacklistedArtists: z
			.string()
			.transform((val) => val.toLocaleLowerCase().trim().split('\n'))
			.refine(
				(val) =>
					val.length <= getApplicationConfigurationSync().maximumBlacklistedArtists &&
					val.every(
						(artist) => artist.length <= getApplicationConfigurationSync().maximumArtistLength,
					),
				`The blacklisted artists exceed the maximum allowed length of ${getApplicationConfigurationSync().maximumArtistLength} characters or the maximum allowed amount of ${getApplicationConfigurationSync().maximumBlacklistedArtists} artists`,
			)
			.optional(),
	}),
} satisfies TRequestSchema;

const UpdateUserUserInterfacePreferencesSchema = {
	form: z.object({
		customSiteWideCss: z
			.string()
			.max(getApplicationConfigurationSync().maximumSiteWideCssLength, {
				message: `The maximum site wide CSS length is ${getApplicationConfigurationSync().maximumSiteWideCssLength} characters`,
			})
			.optional(),
		hidePostMetadataOnPreview: BoolStrSchema.optional(),
		hideCollectionMetadataOnPreview: BoolStrSchema.optional(),
		hideImageCarousel: BoolStrSchema.optional(),
	}),
} satisfies TRequestSchema;

const UserForgotPasswordSchema = {
	form: z.object({
		email: z
			.string()
			.email()
			.transform((val) => val.toLocaleLowerCase().trim()),
	}),
} satisfies TRequestSchema;

const UserVerifyEmailSchema = {
	pathParams: z.object({
		tokenId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const UserResendVerificationSchema = {} satisfies TRequestSchema;

const UserGetPasswordRecoverySessionSchema = {
	pathParams: z.object({
		recoveryId: z.string(),
	}),
} satisfies TRequestSchema;

const UserUpdatePasswordAccountRecoverySchema = {
	form: z.object({
		newPassword: passwordRequirementSchema,
		confirmedNewPassword: z.string().min(1, 'The confirmed new password cannot be empty'),
		passwordRecoveryAttemptId: z.string().uuid(),
		userId: z.string().uuid(),
	}),
} satisfies TRequestSchema;

const UserDataExportSchema = {
	body: z.object({
		exportLinkedAccounts: BoolStrSchema.optional(),
		exportPreferences: BoolStrSchema.optional(),
		exportUploadedPosts: BoolStrSchema.optional(),
		exportLikedPosts: BoolStrSchema.optional(),
		exportCreatedPostCollections: BoolStrSchema.optional(),
		exportFriends: BoolStrSchema.optional(),
		sendEmail: BoolStrSchema.optional().default(false),
		format: z.enum(['JSON', 'CSV', 'TXT', 'XLSX']).optional().default('JSON'),
	}),
} satisfies TRequestSchema;

export {
	GetUserSchema,
	UpdateUserPersonalPreferencesSchema,
	UpdateUserUserInterfacePreferencesSchema,
	User2faEnableSchema,
	UserAuthEndpointSchema,
	UserAuthFormSchema,
	UserChangePasswordSchema,
	UserChangeProfilePictureSchema,
	UserChangeUsernameSchema,
	UserCreateSchema,
	UserDataExportSchema,
	UserDeleteSchema,
	UserForgotPasswordSchema,
	UserGetPasswordRecoverySessionSchema,
	UserResendVerificationSchema,
	UserGetTotpSchema,
	UserOtpGenerateSchema,
	UserProcessTotpSchema,
	UserRoleUpdateSchema,
	UserUpdatePasswordAccountRecoverySchema,
	UserVerifyEmailSchema,
};
