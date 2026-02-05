import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import {
  MicrophoneIcon,
  XMarkIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  PresentationChartBarIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";

export interface SpeechContext {
  speechType: string;
  audience: string;
  goal: string;
  focusAreas: string[];
  additionalNotes: string;
}

interface SpeechContextModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (context: SpeechContext) => void;
}

const SPEECH_TYPES = [
  { id: "pitch", label: "Pitch/Presentation", icon: PresentationChartBarIcon },
  { id: "interview", label: "Job Interview", icon: BriefcaseIcon },
  { id: "academic", label: "Academic/Thesis", icon: AcademicCapIcon },
  { id: "meeting", label: "Team Meeting", icon: UserGroupIcon },
  { id: "casual", label: "Casual Practice", icon: ChatBubbleLeftRightIcon },
];

const AUDIENCES = [
  { id: "investors", label: "Investors" },
  { id: "executives", label: "Executives" },
  { id: "technical", label: "Technical Team" },
  { id: "general", label: "General Audience" },
  { id: "academic", label: "Academic Panel" },
  { id: "interviewer", label: "Interviewer" },
];

const FOCUS_AREAS = [
  { id: "filler", label: "Reduce Fillers" },
  { id: "pace", label: "Pace Control" },
  { id: "clarity", label: "Clarity" },
  { id: "confidence", label: "Confidence" },
  { id: "structure", label: "Structure" },
  { id: "engagement", label: "Engagement" },
];

export function SpeechContextModal({
  visible,
  onClose,
  onSubmit,
}: SpeechContextModalProps) {
  const [speechType, setSpeechType] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const toggleFocusArea = (id: string) => {
    if (focusAreas.includes(id)) {
      setFocusAreas(focusAreas.filter((f) => f !== id));
    } else {
      setFocusAreas([...focusAreas, id]);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      speechType:
        SPEECH_TYPES.find((t) => t.id === speechType)?.label || speechType,
      audience: AUDIENCES.find((a) => a.id === audience)?.label || audience,
      goal,
      focusAreas: focusAreas.map(
        (f) => FOCUS_AREAS.find((fa) => fa.id === f)?.label || f
      ),
      additionalNotes,
    });
    resetForm();
  };

  const handleSkip = () => {
    onSubmit({
      speechType: "General Practice",
      audience: "General",
      goal: "",
      focusAreas: [],
      additionalNotes: "",
    });
    resetForm();
  };

  const resetForm = () => {
    setSpeechType("");
    setAudience("");
    setGoal("");
    setFocusAreas([]);
    setAdditionalNotes("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-primary rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-secondary/20">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-accent items-center justify-center mr-3">
                  <SparklesIcon size={20} color="#023047" />
                </View>
                <View>
                  <Text
                    className="text-xl text-white"
                    style={{ fontFamily: "CabinetGrotesk-Bold" }}
                  >
                    Speech Context
                  </Text>
                  <Text
                    className="text-secondary-light text-sm"
                    style={{ fontFamily: "CabinetGrotesk-Light" }}
                  >
                    Help us understand your speech
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2">
                <XMarkIcon size={24} color="#8ecae6" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Speech Type */}
              <View className="mb-6">
                <Text
                  className="text-white text-base mb-3"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  What type of speech is this?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SPEECH_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = speechType === type.id;
                    return (
                      <TouchableOpacity
                        key={type.id}
                        onPress={() => setSpeechType(type.id)}
                        className={`flex-row items-center px-4 py-3 rounded-xl border ${
                          isSelected
                            ? "bg-accent border-accent"
                            : "bg-background-card border-secondary/30"
                        }`}
                      >
                        <Icon
                          size={18}
                          color={isSelected ? "#023047" : "#8ecae6"}
                        />
                        <Text
                          className={`ml-2 ${isSelected ? "text-primary" : "text-secondary-light"}`}
                          style={{ fontFamily: "CabinetGrotesk-Medium" }}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Audience */}
              <View className="mb-6">
                <Text
                  className="text-white text-base mb-3"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  Who is your audience?
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {AUDIENCES.map((aud) => {
                    const isSelected = audience === aud.id;
                    return (
                      <TouchableOpacity
                        key={aud.id}
                        onPress={() => setAudience(aud.id)}
                        className={`px-4 py-2 rounded-full border ${
                          isSelected
                            ? "bg-secondary border-secondary"
                            : "bg-transparent border-secondary/30"
                        }`}
                      >
                        <Text
                          className={
                            isSelected ? "text-primary" : "text-secondary-light"
                          }
                          style={{ fontFamily: "CabinetGrotesk-Medium" }}
                        >
                          {aud.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Goal */}
              <View className="mb-6">
                <Text
                  className="text-white text-base mb-3"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  What's your main goal?
                </Text>
                <TextInput
                  value={goal}
                  onChangeText={setGoal}
                  placeholder="e.g., Convince investors, explain a concept..."
                  placeholderTextColor="#6bb8d4"
                  className="bg-background-card border border-secondary/30 rounded-xl px-4 py-3 text-white"
                  style={{ fontFamily: "CabinetGrotesk-Regular" }}
                />
              </View>

              {/* Focus Areas */}
              <View className="mb-6">
                <Text
                  className="text-white text-base mb-3"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  Areas to focus on (select multiple)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {FOCUS_AREAS.map((area) => {
                    const isSelected = focusAreas.includes(area.id);
                    return (
                      <TouchableOpacity
                        key={area.id}
                        onPress={() => toggleFocusArea(area.id)}
                        className={`px-4 py-2 rounded-full border ${
                          isSelected
                            ? "bg-orange border-orange"
                            : "bg-transparent border-secondary/30"
                        }`}
                      >
                        <Text
                          className={
                            isSelected ? "text-white" : "text-secondary-light"
                          }
                          style={{ fontFamily: "CabinetGrotesk-Medium" }}
                        >
                          {area.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Additional Notes */}
              <View className="mb-6">
                <Text
                  className="text-white text-base mb-3"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  Additional context (optional)
                </Text>
                <TextInput
                  value={additionalNotes}
                  onChangeText={setAdditionalNotes}
                  placeholder="Any specific concerns or context..."
                  placeholderTextColor="#6bb8d4"
                  multiline
                  numberOfLines={3}
                  className="bg-background-card border border-secondary/30 rounded-xl px-4 py-3 text-white min-h-[80px]"
                  style={{
                    fontFamily: "CabinetGrotesk-Regular",
                    textAlignVertical: "top",
                  }}
                />
              </View>

              <View className="h-4" />
            </ScrollView>

            {/* Action Buttons */}
            <View className="px-6 pb-8 pt-4 border-t border-secondary/20">
              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-accent rounded-xl py-4 items-center mb-3"
                style={{
                  shadowColor: "#ffb703",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <MicrophoneIcon size={20} color="#023047" />
                  <Text
                    className="text-primary text-lg ml-2"
                    style={{ fontFamily: "CabinetGrotesk-Bold" }}
                  >
                    Start Recording
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSkip}
                className="py-3 items-center"
              >
                <Text
                  className="text-secondary-light"
                  style={{ fontFamily: "CabinetGrotesk-Medium" }}
                >
                  Skip - Quick Practice
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
