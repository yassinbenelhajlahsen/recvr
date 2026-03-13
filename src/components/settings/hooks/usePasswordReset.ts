import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { passwordMeetsRequirements } from "@/components/ui/PasswordChecklist";

export function usePasswordReset(open: boolean) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Reset on drawer close
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form on drawer close
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordError(null);
      setPasswordSuccess(false);
    }
  }, [open]);

  const confirmMismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword;

  async function handleResetPassword() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordMeetsRequirements(newPassword)) {
      setPasswordError("Password does not meet all requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setPasswordSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordError,
    setPasswordError,
    passwordSuccess,
    setPasswordSuccess,
    passwordSaving,
    confirmMismatch,
    handleResetPassword,
  };
}
