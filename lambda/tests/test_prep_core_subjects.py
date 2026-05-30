"""Tests for core_subjects support in prep_admin_handler.py."""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prep_admin_handler import normalize_core_subject

NOW = "2026-05-30T00:00:00Z"


class TestNormalizeCoreSubject:
    def test_concept_defaults(self):
        result = normalize_core_subject({"title": "Intro to SQL"}, NOW)
        assert result["id"].startswith("cs-")
        assert result["subject"] == "general"
        assert result["section"] == "General"
        assert result["contentKind"] == "concept"
        assert result["difficulty"] == "Medium"
        assert result["displayOrder"] == 0

    def test_concept_subject_slug_normalized(self):
        result = normalize_core_subject({"title": "TCP/IP", "subject": "CN"}, NOW)
        assert result["subject"] == "cn"

    def test_concept_any_subject_slug_accepted(self):
        result = normalize_core_subject({"title": "X", "subject": "custom-subject"}, NOW)
        assert result["subject"] == "custom-subject"

    def test_concept_topics_and_display_order(self):
        result = normalize_core_subject(
            {
                "title": "Paging",
                "subject": "os",
                "topics": ["Memory", "Paging"],
                "displayOrder": 3,
                "difficulty": "Hard",
            },
            NOW,
        )
        assert result["topics"] == ["Memory", "Paging"]
        assert result["displayOrder"] == 3
        assert result["difficulty"] == "Hard"

    def test_category_defaults(self):
        result = normalize_core_subject({"title": "DBMS", "contentKind": "category"}, NOW)
        assert result["id"].startswith("csc-")
        assert result["contentKind"] == "category"
        assert result["slug"] == "dbms"
        assert result["subject"] == "dbms"
        assert result["title"] == "DBMS"
        assert result["displayOrder"] == 0

    def test_category_slug_from_explicit_value(self):
        result = normalize_core_subject(
            {"title": "Operating System", "contentKind": "category", "slug": "os"},
            NOW,
        )
        assert result["slug"] == "os"
        assert result["subject"] == "os"
