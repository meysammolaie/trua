
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createTaskAction, getTasksAction, deleteTaskAction, Task } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";

const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  rewardAmount: z.coerce.number().positive("Reward amount must be positive."),
  rewardType: z.enum(["usd", "gold"]),
});

export default function AdminTasksPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      rewardAmount: 10,
      rewardType: "usd",
    },
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const existingTasks = await getTasksAction();
      setTasks(existingTasks);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "There was a problem getting the task list." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      const result = await createTaskAction(values);
      if (result.success) {
        toast({ title: "Success", description: "New task created successfully." });
        form.reset();
        await fetchTasks();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Creating Task",
        description: error instanceof Error ? error.message : "An error occurred.",
      });
    }
  };

   const handleDelete = async (taskId: string) => {
    try {
        const result = await deleteTaskAction({ taskId });
        if(result.success) {
            toast({ title: "Success", description: "Task deleted successfully." });
            await fetchTasks();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error Deleting Task",
            description: error instanceof Error ? error.message : "An error occurred.",
        });
    }
  }


  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Task</CardTitle>
          <CardDescription>
            Define new tasks for users to complete and earn rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Refer 5 friends to the platform" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Task Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Fully describe the conditions and how to complete the task." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="rewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount ($)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Create Task
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Tasks List</CardTitle>
          <CardDescription>Manage the tasks defined in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Reward</TableHead>
                <TableHead>Creation Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10">
                    No tasks have been defined.
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">${task.rewardAmount.toLocaleString()}</Badge>
                    </TableCell>
                    <TableCell>{task.createdAt}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(task.id!)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
