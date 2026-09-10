import os
import re

target_dir = 'd:\\Projects\\schollygo\\Development\\schollygov1'
extensions = ('.py', '.tsx', '.ts')

replacements = {
    'chapter_code': 'chapter_code',
    'topic_code': 'topic_code',
    'subject_code': 'subject_code',
    'chapterCode': 'chapterCode',
    'topicCode': 'topicCode',
    'subjectCode': 'subjectCode',
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    # Extra fix for Python typing if they had `topic_code: str`
    new_content = re.sub(r'(topic_code|chapter_code|subject_code):\s*int', r'\1: str', new_content)
    new_content = re.sub(r'(topicCode|chapterCode|subjectCode):\s*number', r'\1: string', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(target_dir):
    if 'node_modules' in root or 'venv' in root or '.git' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith(extensions):
            process_file(os.path.join(root, file))
print("Global refactor complete!")
