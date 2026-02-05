import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function PPTAnalyzerScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <Text className="text-2xl font-bold text-primary-dark">
            PPT Analyzer
          </Text>
          <Text className="text-secondary-dark mt-1">
            Get AI feedback on your presentation slides
          </Text>
        </View>

        {/* Upload Section */}
        <View className="px-6 flex-1 justify-center">
          <TouchableOpacity
            className="bg-background-card border-2 border-dashed border-secondary rounded-2xl p-8 items-center"
            activeOpacity={0.7}
          >
            <View className="bg-primary-light w-20 h-20 rounded-full items-center justify-center mb-4">
              <Ionicons name="cloud-upload-outline" size={40} color="#006d77" />
            </View>
            <Text className="text-lg font-semibold text-primary-dark text-center">
              Upload Presentation
            </Text>
            <Text className="text-secondary-dark text-center mt-2">
              Tap to select a PowerPoint or PDF file
            </Text>
            <View className="flex-row items-center mt-4 bg-secondary-light px-4 py-2 rounded-full">
              <Ionicons name="document-outline" size={16} color="#006d77" />
              <Text className="text-primary ml-2 text-sm">.pptx, .ppt, .pdf</Text>
            </View>
          </TouchableOpacity>

          {/* Features */}
          <View className="mt-8">
            <Text className="text-lg font-semibold text-primary-dark mb-4">
              What we analyze
            </Text>

            <View className="bg-background-card rounded-2xl p-5 border border-secondary-light">
              <FeatureItem
                iconName="text-outline"
                title="Content Quality"
                description="Text clarity, readability, and message effectiveness"
              />
              <View className="h-px bg-secondary-light my-4" />
              <FeatureItem
                iconName="color-palette-outline"
                title="Visual Design"
                description="Color consistency, layout, and visual hierarchy"
              />
              <View className="h-px bg-secondary-light my-4" />
              <FeatureItem
                iconName="images-outline"
                title="Slide Structure"
                description="Flow, organization, and slide count optimization"
              />
              <View className="h-px bg-secondary-light my-4" />
              <FeatureItem
                iconName="sparkles-outline"
                title="AI Suggestions"
                description="Personalized tips to improve your presentation"
              />
            </View>
          </View>

          {/* Coming Soon Notice */}
          <View className="mt-6 bg-accent-light rounded-2xl p-4 flex-row items-center">
            <Ionicons name="construct-outline" size={24} color="#e29578" />
            <View className="ml-3 flex-1">
              <Text className="text-accent-dark font-semibold">Coming Soon</Text>
              <Text className="text-accent-dark text-sm mt-1">
                PPT analysis feature is under development
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({
  iconName,
  title,
  description,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start">
      <View className="bg-primary-light w-10 h-10 rounded-full items-center justify-center">
        <Ionicons name={iconName} size={20} color="#006d77" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-primary-dark font-medium">{title}</Text>
        <Text className="text-secondary-dark text-sm mt-1">{description}</Text>
      </View>
    </View>
  );
}
