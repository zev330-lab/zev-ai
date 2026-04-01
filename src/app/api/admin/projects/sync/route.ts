import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isValidSession } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { scanWorkspace } from '@/lib/project-scanner';

async function isAuthed() {
  const cookieStore = await cookies();
  return isValidSession(cookieStore.get('admin_auth')?.value);
}

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow in development — filesystem access doesn't work on Vercel
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Workspace sync only available in local development' },
      { status: 400 },
    );
  }

  try {
    const scanned = scanWorkspace();
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const project of scanned) {
      // Check if project already exists by workspace_dir
      const { data: existing } = await supabase
        .from('projects')
        .select('id, workspace_dir, name')
        .eq('workspace_dir', project.workspace_dir)
        .maybeSingle();

      if (existing) {
        // Update metadata only — don't overwrite manual edits to name/client/status
        const { error } = await supabase
          .from('projects')
          .update({
            local_path: project.local_path,
            github_url: project.github_url,
            deployed_url: project.deployed_url,
            tech_stack: project.tech_stack,
            last_commit_date: project.last_commit_date,
            last_commit_message: project.last_commit_message,
            git_branch: project.git_branch,
            readme_summary: project.readme_summary,
            synced_at: now,
          })
          .eq('id', existing.id);

        if (error) {
          console.error(`Failed to update ${project.workspace_dir}:`, error);
          skipped++;
        } else {
          updated++;
        }
      } else {
        // Also check by similar name (fuzzy match for seeded projects)
        const { data: byName } = await supabase
          .from('projects')
          .select('id, name')
          .ilike('name', `%${project.workspace_dir.replace(/-/g, '%')}%`)
          .maybeSingle();

        if (byName) {
          // Link existing seeded project to workspace directory
          const { error } = await supabase
            .from('projects')
            .update({
              workspace_dir: project.workspace_dir,
              local_path: project.local_path,
              github_url: project.github_url,
              deployed_url: project.deployed_url,
              tech_stack: project.tech_stack,
              last_commit_date: project.last_commit_date,
              last_commit_message: project.last_commit_message,
              git_branch: project.git_branch,
              readme_summary: project.readme_summary,
              synced_at: now,
            })
            .eq('id', byName.id);

          if (error) {
            console.error(`Failed to link ${project.workspace_dir}:`, error);
            skipped++;
          } else {
            updated++;
          }
        } else {
          // Create new project
          const { error } = await supabase.from('projects').insert({
            name: project.name,
            client: project.client,
            status: project.status,
            description: project.description,
            tola_node: 'gateway',
            workspace_dir: project.workspace_dir,
            local_path: project.local_path,
            github_url: project.github_url,
            deployed_url: project.deployed_url,
            tech_stack: project.tech_stack,
            last_commit_date: project.last_commit_date,
            last_commit_message: project.last_commit_message,
            git_branch: project.git_branch,
            readme_summary: project.readme_summary,
            synced_at: now,
            start_date: project.last_commit_date
              ? new Date(project.last_commit_date).toISOString().slice(0, 10)
              : null,
          });

          if (error) {
            console.error(`Failed to create ${project.workspace_dir}:`, error);
            skipped++;
          } else {
            created++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      scanned: scanned.length,
      created,
      updated,
      skipped,
      projects: scanned.map((p) => ({
        name: p.name,
        status: p.status,
        tech_stack: p.tech_stack,
        last_commit_date: p.last_commit_date,
        workspace_dir: p.workspace_dir,
      })),
    });
  } catch (err) {
    console.error('Workspace sync error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
