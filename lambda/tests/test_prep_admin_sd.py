"""
Tests for PrepSystemDesign-related features in prep_admin_handler.py:
  - normalize_system_design: diagramData handling, additionalImageUrls
  - handle_get_sd_media_upload_url: validation and presigned URL generation
"""

import json
import pytest
from unittest.mock import patch, MagicMock
from botocore.exceptions import ClientError
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from prep_admin_handler import (
    normalize_system_design,
    handle_get_sd_media_upload_url,
    handle_list_content,
    ALLOWED_SD_MEDIA_CONTENT_TYPES,
)

NOW = "2024-01-01T00:00:00Z"

# ──────────────────────────────────────────────────────────────────────────────
# normalize_system_design
# ──────────────────────────────────────────────────────────────────────────────

class TestNormalizeSystemDesign:
    def _base(self, **kwargs):
        return {"id": "sd-1", "title": "Test", "description": "Desc", **kwargs}

    def test_design_type_defaults_to_hld(self):
        result = normalize_system_design(self._base(), NOW)
        assert result["designType"] == "hld"
        assert result["type"] == "HLD"

    def test_design_type_lld_normalized(self):
        result = normalize_system_design(self._base(designType="LLD"), NOW)
        assert result["designType"] == "lld"
        assert result["type"] == "LLD"

    def test_design_type_invalid_defaults_hld(self):
        result = normalize_system_design(self._base(designType="unknown"), NOW)
        assert result["designType"] == "hld"

    # diagramData tests
    def test_diagram_data_dict_passthrough(self):
        diagram = {"nodes": [{"id": "n1"}], "edges": []}
        result = normalize_system_design(self._base(diagramData=diagram), NOW)
        assert result["diagramData"] == diagram

    def test_diagram_data_json_string_parsed(self):
        diagram = {"nodes": [], "edges": [{"from": "a", "to": "b"}]}
        result = normalize_system_design(
            self._base(diagramData=json.dumps(diagram)), NOW
        )
        assert result["diagramData"] == diagram

    def test_diagram_data_invalid_json_string_omitted(self):
        result = normalize_system_design(self._base(diagramData="not-json"), NOW)
        assert "diagramData" not in result

    def test_diagram_data_none_omitted(self):
        result = normalize_system_design(self._base(diagramData=None), NOW)
        assert "diagramData" not in result

    def test_diagram_data_absent_omitted(self):
        result = normalize_system_design(self._base(), NOW)
        assert "diagramData" not in result

    # additionalImageUrls tests
    def test_additional_image_urls_valid_list(self):
        urls = ["https://cdn.example.com/a.png", "https://cdn.example.com/b.jpg"]
        result = normalize_system_design(self._base(additionalImageUrls=urls), NOW)
        assert result["additionalImageUrls"] == urls

    def test_additional_image_urls_empty_list(self):
        result = normalize_system_design(self._base(additionalImageUrls=[]), NOW)
        assert result["additionalImageUrls"] == []

    def test_additional_image_urls_absent_defaults_empty(self):
        result = normalize_system_design(self._base(), NOW)
        assert result["additionalImageUrls"] == []

    def test_additional_image_urls_filters_empty_strings(self):
        result = normalize_system_design(
            self._base(additionalImageUrls=["https://a.com/img.png", "", "  "]), NOW
        )
        assert result["additionalImageUrls"] == ["https://a.com/img.png"]

    def test_additional_image_urls_non_list_becomes_empty(self):
        result = normalize_system_design(self._base(additionalImageUrls="not-a-list"), NOW)
        assert result["additionalImageUrls"] == []

    # top-level field tests
    def test_topics_filtered(self):
        result = normalize_system_design(
            self._base(topics=["API Gateway", "", None, "Load Balancer"]), NOW
        )
        assert result["topics"] == ["API Gateway", "Load Balancer"]

    def test_updated_at_always_now(self):
        result = normalize_system_design(self._base(updatedAt="old"), NOW)
        assert result["updatedAt"] == NOW

    def test_created_at_preserved_if_present(self):
        result = normalize_system_design(self._base(createdAt="2023-01-01T00:00:00Z"), NOW)
        assert result["createdAt"] == "2023-01-01T00:00:00Z"

    def test_created_at_defaults_to_now_if_absent(self):
        result = normalize_system_design(self._base(), NOW)
        assert result["createdAt"] == NOW


# ──────────────────────────────────────────────────────────────────────────────
# handle_get_sd_media_upload_url
# ──────────────────────────────────────────────────────────────────────────────

class TestHandleGetSdMediaUploadUrl:

    def test_missing_filename_returns_400(self):
        result = handle_get_sd_media_upload_url({})
        body = json.loads(result["body"])
        assert result["statusCode"] == 400
        assert body["success"] is False
        assert "filename" in body["message"]

    def test_unsupported_content_type_returns_400(self):
        result = handle_get_sd_media_upload_url(
            {"filename": "arch.pdf", "contentType": "application/pdf"}
        )
        body = json.loads(result["body"])
        assert result["statusCode"] == 400
        assert body["success"] is False
        assert "Unsupported content type" in body["message"]

    @pytest.mark.parametrize("ct", sorted(ALLOWED_SD_MEDIA_CONTENT_TYPES))
    def test_allowed_content_types_accepted(self, ct):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "https://presigned.url/upload"

        with patch("prep_admin_handler.s3_client", mock_s3):
            result = handle_get_sd_media_upload_url(
                {"filename": "image.png", "contentType": ct}
            )
        body = json.loads(result["body"])
        assert result["statusCode"] == 200
        assert body["success"] is True

    def test_success_returns_expected_fields(self):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "https://presigned.url/upload"

        with patch("prep_admin_handler.s3_client", mock_s3):
            result = handle_get_sd_media_upload_url(
                {"filename": "diagram.png", "contentType": "image/png"}
            )
        body = json.loads(result["body"])
        assert result["statusCode"] == 200
        assert body["success"] is True
        assert "uploadUrl" in body
        assert "s3Key" in body
        assert "publicUrl" in body
        assert body["expiresIn"] == 3600

    def test_s3_key_uses_system_design_prefix(self):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "https://presigned.url/upload"

        with patch("prep_admin_handler.s3_client", mock_s3):
            result = handle_get_sd_media_upload_url(
                {"filename": "mydiagram.png", "contentType": "image/png"}
            )
        body = json.loads(result["body"])
        assert body["s3Key"].startswith("system-design/")
        assert body["s3Key"].endswith("/mydiagram.png")

    def test_default_content_type_is_image_png(self):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.return_value = "https://presigned.url/upload"

        with patch("prep_admin_handler.s3_client", mock_s3):
            result = handle_get_sd_media_upload_url({"filename": "arch.png"})
        assert result["statusCode"] == 200

    def test_s3_client_error_returns_500(self):
        mock_s3 = MagicMock()
        mock_s3.generate_presigned_url.side_effect = ClientError(
            {"Error": {"Code": "AccessDenied", "Message": "Access Denied"}},
            "generate_presigned_url",
        )

        with patch("prep_admin_handler.s3_client", mock_s3):
            result = handle_get_sd_media_upload_url(
                {"filename": "arch.png", "contentType": "image/png"}
            )
        body = json.loads(result["body"])
        assert result["statusCode"] == 500
        assert body["success"] is False


class MockScanTable:
    def __init__(self, items):
        self.items = items

    def scan(self, **kwargs):
        filter_expr = kwargs.get("FilterExpression")
        if filter_expr is None:
            return {"Items": self.items}

        filtered = []
        for item in self.items:
            if filter_expr.evaluate(item):
                filtered.append(item)
        return {"Items": filtered}


class FakeCondition:
    def __init__(self, evaluator):
        self.evaluator = evaluator

    def __and__(self, other):
        return FakeCondition(lambda item: self.evaluate(item) and other.evaluate(item))

    def __or__(self, other):
        return FakeCondition(lambda item: self.evaluate(item) or other.evaluate(item))

    def evaluate(self, item):
        return self.evaluator(item)


class FakeAttr:
    def __init__(self, name):
        self.name = name

    def eq(self, value):
        return FakeCondition(lambda item: item.get(self.name) == value)


class TestHandleListContentSystemDesign:
    def test_filters_hld_rows_by_design_type(self):
        items = [
            {"id": "hld-1", "designType": "hld", "type": "HLD", "title": "HLD 1", "createdAt": "2024-01-01T00:00:00Z"},
            {"id": "lld-1", "designType": "lld", "type": "LLD", "title": "LLD 1", "createdAt": "2024-01-02T00:00:00Z"},
        ]
        with patch("prep_admin_handler.Attr", FakeAttr), patch("prep_admin_handler.get_table", return_value=MockScanTable(items)):
            result = handle_list_content("system_design", {"designType": "hld", "limit": 50})

        body = json.loads(result["body"])
        assert result["statusCode"] == 200
        assert body["success"] is True
        assert len(body["items"]) == 1
        assert body["items"][0]["id"] == "hld-1"

    def test_filters_lld_rows_by_legacy_type_field(self):
        items = [
            {"id": "legacy-hld", "type": "HLD", "title": "Legacy HLD", "createdAt": "2024-01-01T00:00:00Z"},
            {"id": "legacy-lld", "type": "LLD", "title": "Legacy LLD", "createdAt": "2024-01-02T00:00:00Z"},
        ]
        with patch("prep_admin_handler.Attr", FakeAttr), patch("prep_admin_handler.get_table", return_value=MockScanTable(items)):
            result = handle_list_content("system_design", {"designType": "lld", "limit": 50})

        body = json.loads(result["body"])
        assert result["statusCode"] == 200
        assert body["success"] is True
        assert len(body["items"]) == 1
        assert body["items"][0]["id"] == "legacy-lld"
