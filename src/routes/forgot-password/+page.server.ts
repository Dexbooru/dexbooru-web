import { ACCOUNT_RECOVERY_EMAIL_SUBJECT, DEXBOORU_NO_REPLY_EMAIL_ADDRESS } from "$lib/server/constants/email";
import { createPasswordRecoveryAttempt } from "$lib/server/db/actions/passwordRecoveryAttempt";
import { findUserByNameOrEmail } from "$lib/server/db/actions/user";
import { sendEmail } from "$lib/server/helpers/email";
import { buildPasswordRecoveryEmailTemplate } from "$lib/server/helpers/passwordRecovery";
import { getFormFields } from "$lib/shared/helpers/forms";
import type { IAccountRecoveryFormFields } from "$lib/shared/types/auth";
import { fail } from "@sveltejs/kit";
import type { Action, Actions } from "./$types";

const sendAccountRecoveryEmail: Action = async ({ request, getClientAddress }) => {
    const passwordRecoveryForm = await request.formData();
    const { email } = getFormFields<IAccountRecoveryFormFields>(passwordRecoveryForm);

    const existingUser = await findUserByNameOrEmail(email, '');
    if (!existingUser) {
        return fail(404, {
            reason: `A user with the email: ${email} does not exist!`,
            email,
        });
    }

    const ipAddress = getClientAddress();
    const publicAccountRecoveryId = await createPasswordRecoveryAttempt(existingUser.id, existingUser.username, existingUser.email, ipAddress);

    await sendEmail({
        sender: `Dexbooru <${DEXBOORU_NO_REPLY_EMAIL_ADDRESS}>`,
        to: existingUser.email,
        subject: ACCOUNT_RECOVERY_EMAIL_SUBJECT,
        html: buildPasswordRecoveryEmailTemplate(existingUser.username, publicAccountRecoveryId),
    });

    return {
        message: `We sent a password recovery attempt to your email at: ${existingUser.email}. It should arrive in your inbox shortly!`
    };
};


export const actions: Actions = {
    default: sendAccountRecoveryEmail,
}