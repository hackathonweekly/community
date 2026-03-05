---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*)
description: Review code changes - uncommitted changes if present, otherwise differences from main branch
argument-hint: [focus-areas]
---

## Context

- Current git status: !`git status`
- Current branch: !`git branch --show-current`
- Recent commit history: !`git log --oneline -5`

## Code Changes to Review

**Priority Logic**: 
- **If uncommitted changes exist** (check git status output above): Review uncommitted changes
- **If no uncommitted changes exist**: Review differences from main branch

### Uncommitted Changes (review these if they exist):
- Unstaged changes: !`git diff`
- Staged changes: !`git diff --cached`
- All uncommitted changes: !`git diff HEAD`

### Differences from main branch (review these if no uncommitted changes):
- Base branch check: !`git show-ref --verify --quiet refs/heads/main && echo "Comparing with main" || (git show-ref --verify --quiet refs/heads/master && echo "Comparing with master" || echo "Neither main nor master branch found")`
- Changes compared to base branch: !`git show-ref --verify --quiet refs/heads/main && git diff main...HEAD 2>/dev/null || git diff master...HEAD 2>/dev/null || echo "No differences found or base branch doesn't exist"`
- Files changed compared to base branch: !`git show-ref --verify --quiet refs/heads/main && git diff --name-status main...HEAD 2>/dev/null || git diff --name-status master...HEAD 2>/dev/null || echo ""`
- Commit messages since base branch: !`git show-ref --verify --quiet refs/heads/main && git log main..HEAD --oneline 2>/dev/null || git log master..HEAD --oneline 2>/dev/null || echo ""`

## Your Task

Based on the git status output above, determine which code to review:

1. **If there are uncommitted changes** (modified, staged, or untracked files shown in git status):
   - Review the uncommitted code changes shown in the "Uncommitted Changes" section above
   - Focus on what has been changed but not yet committed

2. **If there are NO uncommitted changes** (working directory is clean):
   - Review the differences between the current branch and the base branch (main or master) shown in the "Differences from main branch" section above
   - Focus on what commits have been made since branching from the base branch
   - If the current branch is the same as the base branch (no differences), inform the user that there are no changes to review

Provide a comprehensive code review focusing on:

1. **Code Quality**
   - Code style and consistency
   - Naming conventions
   - Code organization and structure
   - Readability and maintainability

2. **Potential Issues**
   - Bugs and logic errors
   - Edge cases that might not be handled
   - Potential runtime errors
   - Type safety issues (if applicable)

3. **Security**
   - Security vulnerabilities
   - Input validation
   - Authentication/authorization concerns
   - Data exposure risks

4. **Performance**
   - Performance bottlenecks
   - Inefficient algorithms or data structures
   - Unnecessary computations
   - Memory leaks or resource management issues

5. **Best Practices**
   - Adherence to project conventions
   - Error handling
   - Documentation and comments
   - Testing considerations

If arguments are provided (e.g., `/review security performance`), prioritize those specific areas in your review.

Provide specific, actionable feedback with:
- Clear identification of issues
- Explanation of why it's a concern
- Concrete suggestions for improvement
- Code examples when helpful

