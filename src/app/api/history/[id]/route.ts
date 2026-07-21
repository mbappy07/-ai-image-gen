import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ============================================================
// DELETE /api/history/:id
// ============================================================
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.generation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "删除失败";
    console.error("[API|history|DELETE]", msg);

    return NextResponse.json(
      { success: false, error: "删除失败，请重试" },
      { status: 500 },
    );
  }
}
