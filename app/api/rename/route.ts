import { NextResponse } from 'next/server';
import { rename, stat } from 'fs/promises';
import { join, dirname, basename } from 'path';

export const runtime = 'nodejs';

// PATCH - Rename a file or folder
export async function PATCH(req: Request) {
  try {
    const { oldPath, newName } = await req.json();
    
    if (!oldPath || !newName || typeof oldPath !== 'string' || typeof newName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Old path and new name are required' },
        { status: 400 }
      );
    }

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return NextResponse.json(
        { success: false, error: 'New name cannot be empty' },
        { status: 400 }
      );
    }

    // Validate the new name doesn't contain invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmedNewName)) {
      return NextResponse.json(
        { success: false, error: 'Name contains invalid characters' },
        { status: 400 }
      );
    }

    const publicDir = join(process.cwd(), 'public');
    const fullOldPath = join(publicDir, oldPath);
    
    // Check if the old path exists
    try {
      await stat(fullOldPath);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'File or folder not found' },
        { status: 404 }
      );
    }

    // Create the new path
    const parentDir = dirname(fullOldPath);
    const fullNewPath = join(parentDir, trimmedNewName);

    // Check if new name already exists
    try {
      await stat(fullNewPath);
      return NextResponse.json(
        { success: false, error: 'A file or folder with this name already exists' },
        { status: 409 }
      );
    } catch (error) {
      // File doesn't exist, which is what we want
    }

    // Perform the rename
    await rename(fullOldPath, fullNewPath);

    return NextResponse.json({
      success: true,
      message: 'Item renamed successfully',
      data: {
        oldPath,
        newPath: oldPath.replace(basename(oldPath), trimmedNewName),
        newName: trimmedNewName
      }
    });
  } catch (error) {
    console.error('Error renaming item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to rename item' },
      { status: 500 }
    );
  }
}
