import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import {
  PracticeTemplate,
  TEMPLATES,
  getTemplatesByCategory,
  DURATION_OPTIONS,
} from "../../src/constants/templates";

function TemplateCard({
  template,
  onPress,
}: {
  template: PracticeTemplate;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-background-card rounded-xl p-4 mb-3 border border-secondary-light"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="bg-primary-light w-12 h-12 rounded-full items-center justify-center mr-3">
          <Ionicons name={template.icon} size={24} color="#006d77" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-primary-dark">
            {template.name}
          </Text>
          <Text className="text-xs text-secondary-dark mt-1" numberOfLines={1}>
            {template.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={18} color="#83c5be" />
      </View>
    </TouchableOpacity>
  );
}

function CategorySection({
  title,
  templates,
  onSelectTemplate,
}: {
  title: string;
  templates: PracticeTemplate[];
  onSelectTemplate: (template: PracticeTemplate) => void;
}) {
  if (templates.length === 0) return null;

  return (
    <View className="mb-6">
      <Text className="text-sm font-semibold text-secondary-dark uppercase tracking-wide mb-3">
        {title}
      </Text>
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onPress={() => onSelectTemplate(template)}
        />
      ))}
    </View>
  );
}

function DurationSelector({
  template,
  onSelectDuration,
  onBack,
}: {
  template: PracticeTemplate;
  onSelectDuration: (duration: number) => void;
  onBack: () => void;
}) {
  return (
    <View className="flex-1">
      <TouchableOpacity onPress={onBack} className="flex-row items-center mb-4">
        <Ionicons name="arrow-back" size={24} color="#006d77" />
        <Text className="text-primary ml-2">Back to templates</Text>
      </TouchableOpacity>

      <View className="bg-background-card rounded-2xl p-5 mb-6 border border-secondary-light">
        <View className="flex-row items-center mb-4">
          <View className="bg-primary-light w-14 h-14 rounded-xl items-center justify-center mr-4">
            <Ionicons name={template.icon} size={28} color="#006d77" />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-primary-dark">
              {template.name}
            </Text>
            <Text className="text-sm text-secondary-dark mt-1">
              {template.description}
            </Text>
          </View>
        </View>

        <View className="bg-primary-light/50 rounded-xl p-4">
          <Text className="text-sm font-semibold text-primary-dark mb-2">
            Tips for this format:
          </Text>
          {template.tips.map((tip, index) => (
            <View key={index} className="flex-row items-start mt-2">
              <Ionicons name="checkmark-circle" size={16} color="#006d77" />
              <Text className="text-sm text-primary-dark ml-2 flex-1">
                {tip}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <Text className="text-lg font-semibold text-primary-dark mb-4">
        Select Duration
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {template.suggestedDurations.map((duration) => {
          const option = DURATION_OPTIONS.find((d) => d.value === duration);
          return (
            <TouchableOpacity
              key={duration}
              onPress={() => onSelectDuration(duration)}
              className="bg-background-card rounded-xl p-4 border border-secondary-light flex-1 min-w-[45%] items-center"
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={24} color="#006d77" />
              <Text className="text-lg font-bold text-primary-dark mt-2">
                {option?.label || `${duration}s`}
              </Text>
              <Text className="text-xs text-secondary-dark mt-1">
                {template.targetWPM.min}-{template.targetWPM.max} WPM
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TemplatesScreen() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] =
    useState<PracticeTemplate | null>(null);

  const professionalTemplates = getTemplatesByCategory("professional");
  const academicTemplates = getTemplatesByCategory("academic");
  const personalTemplates = getTemplatesByCategory("personal");

  const handleSelectTemplate = (template: PracticeTemplate) => {
    setSelectedTemplate(template);
  };

  const handleSelectDuration = (duration: number) => {
    if (selectedTemplate) {
      router.push({
        pathname: "/practice/record/structured",
        params: {
          templateId: selectedTemplate.id,
          targetDuration: duration.toString(),
        },
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#006d77" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-primary-dark">
              {selectedTemplate ? "Choose Duration" : "Practice Templates"}
            </Text>
          </View>
          <Text className="text-secondary-dark">
            {selectedTemplate
              ? `Set your target time for ${selectedTemplate.name}`
              : "Select a template that matches your presentation style"}
          </Text>
        </View>

        <View className="px-6">
          {selectedTemplate ? (
            <DurationSelector
              template={selectedTemplate}
              onSelectDuration={handleSelectDuration}
              onBack={() => setSelectedTemplate(null)}
            />
          ) : (
            <>
              <CategorySection
                title="Professional"
                templates={professionalTemplates}
                onSelectTemplate={handleSelectTemplate}
              />
              <CategorySection
                title="Academic"
                templates={academicTemplates}
                onSelectTemplate={handleSelectTemplate}
              />
              <CategorySection
                title="Personal"
                templates={personalTemplates}
                onSelectTemplate={handleSelectTemplate}
              />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
