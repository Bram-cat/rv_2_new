import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  DocumentTextIcon,
  SwatchIcon,
  PhotoIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "react-native-heroicons/outline";

export default function PPTAnalyzerScreen() {
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/pdf",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert(
          "File Selected",
          `Name: ${file.name}\nSize: ${(file.size! / 1024).toFixed(2)} KB\n\nNote: This feature is coming soon!`,
          [{ text: "OK" }]
        );
        // TODO: Implement file upload and analysis
        console.log("Selected file:", file);
      }
    } catch (err) {
      console.error("Error picking document:", err);
      Alert.alert("Error", "Failed to pick document");
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text
            className="text-2xl text-white"
            style={{ fontFamily: "CabinetGrotesk-Bold" }}
          >
            Slide Analyzer
          </Text>
          <Text
            className="text-secondary-light mt-1"
            style={{ fontFamily: "CabinetGrotesk-Light" }}
          >
            Get AI feedback on your presentation slides
          </Text>
        </View>

        {/* Upload Section */}
        <View className="px-6 flex-1 justify-center">
          <TouchableOpacity
            className="bg-background-card border-2 border-dashed border-secondary/30 rounded-2xl p-8 items-center"
            activeOpacity={0.7}
            onPress={handlePickDocument}
          >
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: "#ffb70330" }}
            >
              <CloudArrowUpIcon size={40} color="#ffb703" />
            </View>
            <Text
              className="text-lg text-white text-center"
              style={{ fontFamily: "CabinetGrotesk-Medium" }}
            >
              Upload Presentation
            </Text>
            <Text
              className="text-secondary-light text-center mt-2"
              style={{ fontFamily: "CabinetGrotesk-Light" }}
            >
              Tap to select a PowerPoint or PDF file
            </Text>
            <View
              className="flex-row items-center mt-4 px-4 py-2 rounded-full"
              style={{ backgroundColor: "#219ebc30" }}
            >
              <DocumentIcon size={16} color="#219ebc" />
              <Text
                className="ml-2 text-sm"
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: "#8ecae6",
                }}
              >
                .pptx, .ppt, .pdf
              </Text>
            </View>
          </TouchableOpacity>

          {/* Features */}
          <View className="mt-8">
            <Text
              className="text-lg text-white mb-4"
              style={{ fontFamily: "CabinetGrotesk-Medium" }}
            >
              What we analyze
            </Text>

            <View className="bg-background-card rounded-2xl p-5 border border-secondary/20">
              <FeatureItem
                icon={DocumentTextIcon}
                title="Content Quality"
                description="Text clarity, readability, and message effectiveness"
                color="#ffb703"
              />
              <View
                className="h-px my-4"
                style={{ backgroundColor: "#219ebc30" }}
              />
              <FeatureItem
                icon={SwatchIcon}
                title="Visual Design"
                description="Color consistency, layout, and visual hierarchy"
                color="#219ebc"
              />
              <View
                className="h-px my-4"
                style={{ backgroundColor: "#219ebc30" }}
              />
              <FeatureItem
                icon={PhotoIcon}
                title="Slide Structure"
                description="Flow, organization, and slide count optimization"
                color="#8ecae6"
              />
              <View
                className="h-px my-4"
                style={{ backgroundColor: "#219ebc30" }}
              />
              <FeatureItem
                icon={SparklesIcon}
                title="AI Suggestions"
                description="Personalized tips to improve your presentation"
                color="#fb8500"
              />
            </View>
          </View>

          {/* Coming Soon Notice */}
          <View
            className="mt-6 rounded-2xl p-4 flex-row items-center"
            style={{ backgroundColor: "#fb850030" }}
          >
            <WrenchScrewdriverIcon size={24} color="#fb8500" />
            <View className="ml-3 flex-1">
              <Text
                style={{
                  fontFamily: "CabinetGrotesk-Medium",
                  color: "#fb8500",
                }}
              >
                Coming Soon
              </Text>
              <Text
                className="text-sm mt-1"
                style={{
                  fontFamily: "CabinetGrotesk-Light",
                  color: "#fc9d33",
                }}
              >
                Slide analysis feature is under development
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View className="flex-row items-start">
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: color + "30" }}
      >
        <Icon size={20} color={color} />
      </View>
      <View className="ml-3 flex-1">
        <Text
          className="text-white"
          style={{ fontFamily: "CabinetGrotesk-Medium" }}
        >
          {title}
        </Text>
        <Text
          className="text-secondary-light text-sm mt-1"
          style={{ fontFamily: "CabinetGrotesk-Light" }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
