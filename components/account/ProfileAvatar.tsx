import useAlert from "@/hooks/useAlert";
import { uploadAvatar } from "@/integrations/auth";
import { useAuth } from "@/stores/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Spinner, useThemeColor } from "heroui-native";
import React, { useRef, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ProfileAvatarProps {
  size?: number;
  editable?: boolean;
  onAvatarChange?: (photoURL: string) => void;
}

export default function ProfileAvatar({ size = 96, editable = true, onAvatarChange }: ProfileAvatarProps) {
  const { user } = useAuth();
  const accentColor = useThemeColor("accent");
  const foregroundColor = useThemeColor("foreground");
  const backgroundColor = useThemeColor("background");
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const [isUploading, setIsUploading] = useState(false);
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<CameraType>("front");

  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const photoURL = localPhotoURL ?? user?.photoURL;

  const handleUploadImage = async (uri: string) => {
    setIsUploading(true);
    setLocalPhotoURL(uri);

    try {
      const downloadURL = await uploadAvatar(uri);

      if (downloadURL) {
        setLocalPhotoURL(downloadURL);
        onAvatarChange?.(downloadURL);
        await showAlert("success", "Avatar Updated!", "Your profile picture has been updated successfully.", "success");
      }
    } catch (error) {
      setLocalPhotoURL(null);
      const message = error instanceof Error ? error.message : "Failed to upload avatar. Please try again.";
      await showAlert("error", "Upload Failed", message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickFromGallery = async () => {
    setShowOptions(false);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        await showAlert("error", "Permission Required", "Please allow access to your photo library to upload an avatar.", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      await handleUploadImage(result.assets[0].uri);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to pick image. Please try again.";
      await showAlert("error", "Error", message, "error");
    }
  };

  const handleOpenCamera = async () => {
    setShowOptions(false);

    // Check camera permission
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        await showAlert("error", "Permission Required", "Please allow camera access to take a photo.", "error");
        return;
      }
    }

    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (photo?.uri) {
        setShowCamera(false);
        await handleUploadImage(photo.uri);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to take photo. Please try again.";
      await showAlert("error", "Error", message, "error");
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleAvatarPress = () => {
    if (!editable || isUploading) return;
    setShowOptions(true);
  };

  return (
    <>
      <Pressable onPress={handleAvatarPress} disabled={!editable || isUploading}>
        <View
          style={{ width: size, height: size, borderRadius: size / 2 }}
          className="bg-accent/10 items-center justify-center overflow-hidden"
        >
          {isUploading ? (
            <Spinner color={accentColor} />
          ) : photoURL ? (
            <Image source={{ uri: photoURL }} style={{ width: size, height: size }} contentFit="cover" transition={200} />
          ) : (
            <MaterialCommunityIcons name="account" size={size * 0.5} color={accentColor} />
          )}
        </View>

        {/* Edit indicator */}
        {editable && !isUploading && (
          <View
            style={{ width: size * 0.3, height: size * 0.3, borderRadius: (size * 0.3) / 2, bottom: 0, right: 0 }}
            className="absolute bg-accent items-center justify-center border-2 border-background"
          >
            <MaterialCommunityIcons name="camera" size={size * 0.15} color="white" />
          </View>
        )}
      </Pressable>

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade" onRequestClose={() => setShowOptions(false)}>
        <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setShowOptions(false)}>
          <View style={{ paddingBottom: insets.bottom + 16, backgroundColor }} className="rounded-t-3xl px-4 pt-4">
            <View className="w-10 h-1 bg-muted/30 rounded-full self-center mb-4" />
            <Text className="text-foreground text-lg font-semibold text-center mb-4">Change Profile Photo</Text>

            <TouchableOpacity onPress={handleOpenCamera} className="flex-row items-center py-4 px-4 rounded-xl bg-accent/10 mb-3">
              <MaterialCommunityIcons name="camera" size={24} color={accentColor} />
              <Text className="text-foreground text-base ml-3">Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePickFromGallery} className="flex-row items-center py-4 px-4 rounded-xl bg-accent/10 mb-3">
              <MaterialCommunityIcons name="image" size={24} color={accentColor} />
              <Text className="text-foreground text-base ml-3">Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowOptions(false)} className="py-4 px-4 rounded-xl bg-muted/10">
              <Text className="text-muted text-base text-center">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide" onRequestClose={() => setShowCamera(false)}>
        <View className="flex-1 bg-black">
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mirror={facing === "front"}>
            {/* Top controls */}
            <View
              style={{ paddingTop: insets.top + 8 }}
              className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-4"
            >
              <TouchableOpacity onPress={() => setShowCamera(false)} className="p-2">
                <MaterialCommunityIcons name="close" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleCameraFacing} className="p-2">
                <MaterialCommunityIcons name="camera-flip" size={28} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom controls */}
            <View style={{ paddingBottom: insets.bottom + 24 }} className="absolute bottom-0 left-0 right-0 items-center">
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="w-20 h-20 rounded-full bg-white/20 items-center justify-center border-4 border-white"
              >
                <View className="w-16 h-16 rounded-full bg-white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </>
  );
}
