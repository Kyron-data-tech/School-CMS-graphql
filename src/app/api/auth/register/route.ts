import { NextResponse } from "next/server";
import {
  registerStudent,
  registerTeacher,
  registerPrincipal,
  registerParent,
  getRegistrationMetadata,
} from "@/lib/auth/register";

export async function GET() {
  try {
    const metadata = await getRegistrationMetadata();
    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load registration metadata.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = (body.role || "student").toLowerCase();

    let result;
    if (role === "student") {
      result = await registerStudent(body);
    } else if (role === "teacher") {
      result = await registerTeacher(body);
    } else if (role === "parent" || role === "guardian") {
      result = await registerParent(body);
    } else if (role === "principal" || role === "headmaster") {
      result = await registerPrincipal(body);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid registration role: "${role}". Must be one of: "student", "teacher", "parent", "principal".`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
      ...("student" in result ? { student: result.student } : {}),
      ...("teacher" in result ? { teacher: result.teacher } : {}),
    });
  } catch (error: any) {
    const isValidationError =
      error.name === "ZodError" ||
      error.message?.includes("must be at least") ||
      error.message?.includes("Invalid email") ||
      error.message?.includes("already exists");

    const status = isValidationError ? 400 : 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to complete registration.",
      },
      { status }
    );
  }
}
