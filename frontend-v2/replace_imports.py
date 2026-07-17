import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Replace constants
    new_content = new_content.replace('from "../../mocks/timeline-page"', 'from "../../constants/fallbacks"')
    new_content = new_content.replace('from "../../mocks/insights-page"', 'from "../../constants/fallbacks"')
    # Except type imports which should go to types/models
    new_content = new_content.replace('import type { TimelineEvent } from "../../constants/fallbacks"', 'import type { TimelineEvent } from "../../types/models"')
    new_content = new_content.replace('import type { Theme } from "../../constants/fallbacks"', 'import type { Theme } from "../../types/models"')
    new_content = new_content.replace('import type { Suggestion } from "../../constants/fallbacks"', 'import type { Suggestion } from "../../types/models"')
    new_content = new_content.replace('import type { Pattern } from "../../constants/fallbacks"', 'import type { Pattern } from "../../types/models"')
    new_content = new_content.replace('import type { Milestone } from "../../constants/fallbacks"', 'import type { Milestone } from "../../types/models"')
    new_content = new_content.replace('import type { Highlight } from "../../constants/fallbacks"', 'import type { Highlight } from "../../types/models"')

    new_content = new_content.replace('import type { Memory as MockMemory } from "../../mocks/memories"', 'import type { Memory as MockMemory } from "../../types/models"')
    new_content = new_content.replace('import type { Memory } from "../../mocks/memories"', 'import type { Memory } from "../../types/models"')
    new_content = new_content.replace('import type { Rediscovery } from "../../mocks/rediscovery"', 'import type { Rediscovery } from "../../types/models"')
    new_content = new_content.replace('import type { ReflectionTimelineItem } from "../../mocks/reflection"', 'import type { ReflectionTimelineItem } from "../../types/models"')
    new_content = new_content.replace('import type { JournalPreview as JournalPreviewType } from "../../mocks/journal-preview"', 'import type { JournalPreviewType } from "../../types/models"')
    new_content = new_content.replace('import type { TimelineEvent } from "../../mocks/timeline"', 'import type { TimelineEvent } from "../../types/models"')

    # Fix the generic mockInsightsPageData import if it was changed
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for filepath in glob.glob('src/**/*.tsx', recursive=True):
    process_file(filepath)
for filepath in glob.glob('src/**/*.ts', recursive=True):
    process_file(filepath)
