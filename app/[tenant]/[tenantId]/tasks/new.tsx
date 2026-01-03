import TaskForm, { TaskFormValues } from "@/components/tasks/TaskForm";
import React from "react";
import { useTasks } from "./_layout";

export default function NewTaskScreen() {
  const { create } = useTasks();

  const handleCreateTask = async (values: TaskFormValues) => {
    await create({
      id: "",
      title: values.title,
      description: values.description,
      status: values.status,
    } as any);
  };

  return <TaskForm mode="create" onSubmit={handleCreateTask} />;
}
