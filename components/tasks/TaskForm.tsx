import useAlert from "@/hooks/useAlert";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Formik } from "formik";
import { Button, Checkbox, FormField, Spinner, TextField, useThemeColor } from "heroui-native";
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

export const STATUS_OPTIONS = [
  { value: "todo", label: "To Do", description: "Task not yet started" },
  { value: "in_progress", label: "In Progress", description: "Currently working on this" },
  { value: "completed", label: "Completed", description: "Task has been finished" },
  { value: "archived", label: "Archived", description: "Task is archived" },
] as const;

export type TaskStatus = (typeof STATUS_OPTIONS)[number]["value"];

export interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
}

// Form validation schema
export const TaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "completed", "archived"]),
});

interface TaskFormProps {
  mode: "create" | "edit";
  initialValues?: TaskFormValues;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

const DEFAULT_VALUES: TaskFormValues = {
  title: "",
  description: "",
  status: "todo",
};

export default function TaskForm({ mode, initialValues = DEFAULT_VALUES, onSubmit }: TaskFormProps) {
  const mutedColor = useThemeColor("muted");
  const themeColorForeground = useThemeColor("foreground");
  const { showAlert } = useAlert();

  const isEditMode = mode === "edit";
  const submitButtonLabel = isEditMode ? "Save Changes" : "Create Task";
  const submittingLabel = isEditMode ? "Saving..." : "Creating...";
  const successTitle = isEditMode ? "Task Updated" : "Task Created";
  const successMessage = isEditMode ? "Your task has been updated successfully." : "Your task has been created successfully.";
  const errorTitle = isEditMode ? "Failed to Update Task" : "Failed to Create Task";

  const handleSubmit = async (values: TaskFormValues, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
    try {
      await onSubmit(values);
      await showAlert("success", successTitle, successMessage, "success");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred. Please try again";
      await showAlert("error", errorTitle, message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-6 py-8 w-full max-w-md mx-auto">
          <Formik
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(TaskFormSchema)}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, setFieldValue }) => (
              <View className="gap-5">
                {/* Title Field */}
                <TextField isRequired isInvalid={!!(touched.title && errors.title)}>
                  <TextField.Label>Title</TextField.Label>
                  <TextField.Input
                    placeholder="Enter task title"
                    autoCapitalize="sentences"
                    value={values.title}
                    onChangeText={handleChange("title")}
                    onBlur={handleBlur("title")}
                  >
                    <TextField.InputStartContent>
                      <Ionicons name="document-text-outline" size={18} color={mutedColor} />
                    </TextField.InputStartContent>
                  </TextField.Input>
                  <TextField.ErrorMessage>{errors.title}</TextField.ErrorMessage>
                </TextField>

                {/* Description Field */}
                <TextField isInvalid={!!(touched.description && errors.description)}>
                  <TextField.Label>Description</TextField.Label>
                  <TextField.Input
                    placeholder="Enter task description (optional)"
                    autoCapitalize="sentences"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    value={values.description}
                    onChangeText={handleChange("description")}
                    onBlur={handleBlur("description")}
                    style={{ minHeight: 100 }}
                  />
                  <TextField.ErrorMessage>{errors.description}</TextField.ErrorMessage>
                </TextField>

                {/* Status Selection */}
                <View className="gap-2">
                  <Text className="text-sm font-medium text-foreground mb-1">Status</Text>
                  <View className="bg-card rounded-xl border border-border overflow-hidden">
                    {STATUS_OPTIONS.map((option, index) => (
                      <FormField
                        key={option.value}
                        isSelected={values.status === option.value}
                        onSelectedChange={() => setFieldValue("status", option.value)}
                      >
                        <View className={`flex-row items-center p-4 ${index < STATUS_OPTIONS.length - 1 ? "border-b border-border" : ""}`}>
                          <FormField.Indicator className="mt-0.5">
                            <Checkbox />
                          </FormField.Indicator>
                          <View className="flex-1 ml-3">
                            <FormField.Label className="text-base font-medium">{option.label}</FormField.Label>
                            <FormField.Description className="text-sm">{option.description}</FormField.Description>
                          </View>
                        </View>
                      </FormField>
                    ))}
                  </View>
                </View>

                {/* Submit Button */}
                <Button
                  size="lg"
                  className="mt-4 flex-row items-center justify-center"
                  isDisabled={isSubmitting}
                  onPress={() => handleSubmit()}
                  variant="primary"
                >
                  <Button.Label>{isSubmitting ? submittingLabel : submitButtonLabel}</Button.Label>
                  {isSubmitting && <Spinner color={themeColorForeground} />}
                </Button>
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
