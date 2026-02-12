import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useSignIn, useSignUp, useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import {
  SparklesIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from "react-native-heroicons/outline";
import { useThemedAlert } from "../src/components/ui/ThemedAlert";

type AuthMode = "sign-in" | "sign-up";

export default function SignInScreen() {
  const router = useRouter();
  const {
    signIn,
    setActive: setSignInActive,
    isLoaded: isSignInLoaded,
  } = useSignIn();
  const {
    signUp,
    setActive: setSignUpActive,
    isLoaded: isSignUpLoaded,
  } = useSignUp();
  const { startSSOFlow } = useSSO();
  const { showAlert } = useThemedAlert();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // Email + Password Sign In
  const handleEmailSignIn = useCallback(async () => {
    if (!isSignInLoaded || !signIn) return;
    if (!email.trim() || !password.trim()) {
      showAlert({
        title: "Missing Fields",
        message: "Please enter both email and password.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password.trim(),
      });

      if (result.status === "complete" && setSignInActive) {
        await setSignInActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Email Sign In Error:", error);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        "Invalid email or password. Please try again.";
      showAlert({ title: "Sign In Failed", message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSignInLoaded,
    signIn,
    email,
    password,
    setSignInActive,
    router,
    showAlert,
  ]);

  // Email + Password Sign Up
  const handleEmailSignUp = useCallback(async () => {
    if (!isSignUpLoaded || !signUp) return;
    if (!email.trim() || !password.trim()) {
      showAlert({
        title: "Missing Fields",
        message: "Please enter email and password.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
        firstName: name.trim() || undefined,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        "Could not create account. Please try again.";
      showAlert({ title: "Sign Up Failed", message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSignUpLoaded, signUp, email, password, name, showAlert]);

  // Verify email code
  const handleVerifyEmail = useCallback(async () => {
    if (!isSignUpLoaded || !signUp) return;
    if (!verificationCode.trim()) {
      showAlert({
        title: "Missing Code",
        message: "Please enter the verification code.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (result.status === "complete" && setSignUpActive) {
        await setSignUpActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        "Invalid verification code. Please try again.";
      showAlert({ title: "Verification Failed", message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSignUpLoaded,
    signUp,
    verificationCode,
    setSignUpActive,
    router,
    showAlert,
  ]);

  // Google OAuth
  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/sso-callback", { scheme: "speechi" }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      console.error("Google Sign In Error:", error);
      const message =
        error?.errors?.[0]?.longMessage ||
        error?.errors?.[0]?.message ||
        "Google sign-in failed. Please try again.";
      showAlert({ title: "Google Sign In Failed", message, type: "error" });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [startSSOFlow, router, showAlert]);

  // Verification screen
  if (pendingVerification) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#023047" }}>
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#219ebc" }}
            >
              <EnvelopeIcon size={40} color="#ffffff" />
            </View>
            <Text
              className="text-2xl text-white text-center mb-2"
              style={{ fontFamily: "CabinetGrotesk-Bold" }}
            >
              Check Your Email
            </Text>
            <Text
              className="text-sm text-center"
              style={{ fontFamily: "CabinetGrotesk-Regular", color: "#8ecae6" }}
            >
              We sent a verification code to {email}
            </Text>
          </View>

          <View
            className="flex-row items-center rounded-2xl px-4 mb-4"
            style={{
              backgroundColor: "#011627",
              borderWidth: 1,
              borderColor: "#034569",
            }}
          >
            <LockClosedIcon size={20} color="#8ecae6" />
            <TextInput
              className="flex-1 py-4 ml-3 text-white"
              style={{
                fontFamily: "CabinetGrotesk-Regular",
                fontSize: 18,
                letterSpacing: 8,
              }}
              placeholder="000000"
              placeholderTextColor="#8ecae640"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
            />
          </View>

          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={isSubmitting}
            className="rounded-2xl p-4 mb-4 items-center"
            style={{
              backgroundColor: "#ffb703",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            activeOpacity={0.8}
          >
            <Text
              className="text-base"
              style={{ fontFamily: "CabinetGrotesk-Bold", color: "#023047" }}
            >
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                await signUp?.prepareEmailAddressVerification({
                  strategy: "email_code",
                });
                showAlert({
                  title: "Code Resent",
                  message: "A new verification code has been sent to your email.",
                  type: "success",
                });
              } catch (error: any) {
                showAlert({
                  title: "Resend Failed",
                  message: error?.errors?.[0]?.message || "Could not resend code.",
                  type: "error",
                });
              }
            }}
            className="items-center py-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-sm"
              style={{ fontFamily: "CabinetGrotesk-Medium", color: "#ffb703" }}
            >
              Resend Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setPendingVerification(false);
              setVerificationCode("");
            }}
            className="items-center py-3"
            activeOpacity={0.7}
          >
            <Text
              className="text-sm"
              style={{ fontFamily: "CabinetGrotesk-Regular", color: "#8ecae6" }}
            >
              Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignInLoaded || !isSignUpLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#023047" }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#ffb703",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <SparklesIcon size={40} color="#023047" />
          </View>
          <Text
            style={{
              fontFamily: "CabinetGrotesk-Bold",
              fontSize: 24,
              color: "#ffffff",
              marginBottom: 8,
            }}
          >
            Speechi
          </Text>
          <ActivityIndicator size="large" color="#ffb703" style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#023047" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6">
            {/* Logo & Title */}
            <View className="items-center mb-8">
              <View
                className="w-20 h-20 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: "#ffb703" }}
              >
                <SparklesIcon size={40} color="#023047" />
              </View>
              <Text
                className="text-3xl text-white text-center mb-1"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                Speechi
              </Text>
              <Text
                className="text-sm text-center"
                style={{
                  fontFamily: "CabinetGrotesk-Regular",
                  color: "#8ecae6",
                }}
              >
                Your AI speech coach
              </Text>
            </View>

            {/* Auth Mode Toggle */}
            <View
              className="flex-row rounded-2xl p-1 mb-6"
              style={{ backgroundColor: "#011627" }}
            >
              <TouchableOpacity
                onPress={() => setAuthMode("sign-in")}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    authMode === "sign-in" ? "#219ebc" : "transparent",
                }}
                activeOpacity={0.8}
              >
                <Text
                  className="text-sm"
                  style={{
                    fontFamily: "CabinetGrotesk-Bold",
                    color: authMode === "sign-in" ? "#ffffff" : "#8ecae680",
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAuthMode("sign-up")}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor:
                    authMode === "sign-up" ? "#219ebc" : "transparent",
                }}
                activeOpacity={0.8}
              >
                <Text
                  className="text-sm"
                  style={{
                    fontFamily: "CabinetGrotesk-Bold",
                    color: authMode === "sign-up" ? "#ffffff" : "#8ecae680",
                  }}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name field (sign-up only) */}
            {authMode === "sign-up" && (
              <View
                className="flex-row items-center rounded-2xl px-4 mb-3"
                style={{
                  backgroundColor: "#011627",
                  borderWidth: 1,
                  borderColor: "#034569",
                }}
              >
                <UserIcon size={20} color="#8ecae6" />
                <TextInput
                  className="flex-1 py-4 ml-3 text-white"
                  style={{ fontFamily: "CabinetGrotesk-Regular", fontSize: 15 }}
                  placeholder="Name (optional)"
                  placeholderTextColor="#8ecae640"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email field */}
            <View
              className="flex-row items-center rounded-2xl px-4 mb-3"
              style={{
                backgroundColor: "#011627",
                borderWidth: 1,
                borderColor: "#034569",
              }}
            >
              <EnvelopeIcon size={20} color="#8ecae6" />
              <TextInput
                className="flex-1 py-4 ml-3 text-white"
                style={{ fontFamily: "CabinetGrotesk-Regular", fontSize: 15 }}
                placeholder="Email address"
                placeholderTextColor="#8ecae640"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            {/* Password field */}
            <View
              className="flex-row items-center rounded-2xl px-4 mb-5"
              style={{
                backgroundColor: "#011627",
                borderWidth: 1,
                borderColor: "#034569",
              }}
            >
              <LockClosedIcon size={20} color="#8ecae6" />
              <TextInput
                className="flex-1 py-4 ml-3 text-white"
                style={{ fontFamily: "CabinetGrotesk-Regular", fontSize: 15 }}
                placeholder="Password"
                placeholderTextColor="#8ecae640"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="p-1"
              >
                {showPassword ? (
                  <EyeSlashIcon size={20} color="#8ecae6" />
                ) : (
                  <EyeIcon size={20} color="#8ecae6" />
                )}
              </TouchableOpacity>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              onPress={
                authMode === "sign-in" ? handleEmailSignIn : handleEmailSignUp
              }
              disabled={isSubmitting}
              className="rounded-2xl p-4 mb-4 items-center"
              style={{
                backgroundColor: "#ffb703",
                opacity: isSubmitting ? 0.7 : 1,
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-base"
                style={{ fontFamily: "CabinetGrotesk-Bold", color: "#023047" }}
              >
                {isSubmitting
                  ? authMode === "sign-in"
                    ? "Signing in..."
                    : "Creating account..."
                  : authMode === "sign-in"
                    ? "Sign In"
                    : "Create Account"}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View style={{ flex: 1, height: 1, backgroundColor: "#034569" }} />
              <Text
                className="mx-4 text-xs"
                style={{ fontFamily: "CabinetGrotesk-Regular", color: "#8ecae680" }}
              >
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: "#034569" }} />
            </View>

            {/* Google OAuth */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="rounded-2xl p-4 mb-4 items-center flex-row justify-center"
              style={{
                backgroundColor: "#011627",
                borderWidth: 1,
                borderColor: "#034569",
                opacity: isGoogleLoading ? 0.7 : 1,
              }}
              activeOpacity={0.8}
            >
              <Text
                className="text-base text-white"
                style={{ fontFamily: "CabinetGrotesk-Bold" }}
              >
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </Text>
            </TouchableOpacity>

            {/* Skip for now */}
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              className="items-center py-3"
              activeOpacity={0.7}
            >
              <Text
                className="text-sm"
                style={{
                  fontFamily: "CabinetGrotesk-Regular",
                  color: "#8ecae680",
                }}
              >
                Skip for now
              </Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text
              className="text-center text-xs mt-6 mb-8"
              style={{ fontFamily: "CabinetGrotesk-Light", color: "#8ecae650" }}
            >
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
