# coding=utf-8
"""
GeoSight is UNICEF's geospatial web-based business intelligence platform.

Contact : geosight-no-reply@unicef.org

.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation; either version 3 of the License, or
    (at your option) any later version.

"""
__author__ = 'irwan@kartoza.com'
__date__ = '13/06/2023'
__copyright__ = ('Copyright 2023, Unicef')

import json

from django.shortcuts import reverse
from rest_framework import serializers

from geosight.data.models.dashboard import Dashboard
from geosight.data.serializer.basemap_layer import BasemapLayerSerializer
from geosight.data.serializer.context_layer import ContextLayerSerializer
from geosight.data.serializer.dashboard_indicator_layer import (
    DashboardIndicatorLayerSerializer
)
from geosight.data.serializer.dashboard_relation import (
    DashboardIndicatorSerializer, DashboardBasemapSerializer,
    DashboardContextLayerSerializer, DashboardRelatedTableSerializer
)
from geosight.data.serializer.dashboard_widget import DashboardWidgetSerializer
from geosight.data.serializer.indicator import IndicatorSerializer
from geosight.data.serializer.related_table import RelatedTableSerializer
from geosight.permission.models.resource.dashboard import DashboardPermission
from geosight.permission.serializer import PermissionSerializer


class DashboardSerializer(serializers.ModelSerializer):
    """Serializer for Dashboard."""

    description = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    widgets = serializers.SerializerMethodField()
    extent = serializers.SerializerMethodField()
    reference_layer = serializers.SerializerMethodField()

    indicators = serializers.SerializerMethodField()
    indicator_layers = serializers.SerializerMethodField()
    context_layers = serializers.SerializerMethodField()

    basemaps_layers = serializers.SerializerMethodField()
    related_tables = serializers.SerializerMethodField()
    filters = serializers.SerializerMethodField()
    permission = serializers.SerializerMethodField()
    user_permission = serializers.SerializerMethodField()
    geo_field = serializers.SerializerMethodField()
    level_config = serializers.SerializerMethodField()

    def get_description(self, obj: Dashboard):
        """Return description."""
        return obj.description if obj.description else ''

    def get_category(self, obj: Dashboard):
        """Return dashboard category name."""
        return obj.group.name if obj.group else ''

    def get_group(self, obj: Dashboard):
        """Return dashboard group name."""
        return obj.group.name if obj.group else ''

    def get_widgets(self, obj: Dashboard):
        """Return widgets."""
        if obj.id:
            return DashboardWidgetSerializer(
                obj.dashboardwidget_set.all(), many=True
            ).data
        else:
            return []

    def get_extent(self, obj: Dashboard):
        """Return extent."""
        return obj.extent.extent if obj.extent else [-100, -60, 100, 60]

    def get_reference_layer(self, obj: Dashboard):
        """Return reference_layer."""
        reference_layer = obj.reference_layer
        if reference_layer:
            return {
                'identifier': reference_layer.identifier,
                'detail_url': reference_layer.detail_url,
                'name': reference_layer.name
            }
        else:
            return {
                'identifier': '',
                'detail_url': ''
            }

    def get_indicators(self, obj: Dashboard):
        """Return indicators."""
        output = []
        for model in obj.dashboardindicator_set.all():
            data = IndicatorSerializer(
                model.object,
                context={'user': self.context.get('user', None)},
                exclude=['last_update']
            ).data
            data['url'] = reverse(
                'dashboard-indicator-values-api',
                args=[obj.slug, model.object.id]
            )
            dashboard_data = DashboardIndicatorSerializer(
                model, context={'user': self.context.get('user', None)}
            ).data
            if dashboard_data['override_style']:
                del data['style']
                del data['style_config']
                del data['style_type']
            else:
                del dashboard_data['style']
                del dashboard_data['style_config']
                del dashboard_data['style_type']
            data.update(dashboard_data)
            output.append(data)

        return output

    def get_indicator_layers(self, obj: Dashboard):
        """Return indicator_layers."""
        dashboard_indicator_layers = []
        for indicator_layer in obj.dashboardindicatorlayer_set.all():
            dashboard_indicator_layers.append(indicator_layer)
        return DashboardIndicatorLayerSerializer(
            dashboard_indicator_layers, many=True,
            context={'user': self.context.get('user', None)},
            exclude=['last_update']
        ).data

    def get_basemaps_layers(self, obj: Dashboard):
        """Return basemapsLayers."""
        output = []
        for model in obj.dashboardbasemap_set.all():
            data = BasemapLayerSerializer(model.object).data
            data.update(
                DashboardBasemapSerializer(
                    model, context={'user': self.context.get('user', None)}
                ).data
            )
            output.append(data)

        return output

    def get_context_layers(self, obj: Dashboard):
        """Return contextLayers."""
        output = []
        for model in obj.dashboardcontextlayer_set.all():
            data = ContextLayerSerializer(
                model.object, context={'user': self.context.get('user', None)}
            ).data
            dashboard_data = DashboardContextLayerSerializer(
                model, context={'user': self.context.get('user', None)}
            ).data
            if dashboard_data['data_fields']:
                del data['data_fields']
            else:
                del dashboard_data['data_fields']
            if dashboard_data['styles']:
                del data['styles']
            else:
                del dashboard_data['styles']
            if dashboard_data['label_styles']:
                del data['label_styles']
            else:
                del dashboard_data['label_styles']
            data.update(dashboard_data)
            output.append(data)
        return output

    def get_related_tables(self, obj: Dashboard):
        """Return related_tables."""
        output = []
        for model in obj.dashboardrelatedtable_set.all():
            data = RelatedTableSerializer(
                model.object, exclude=['rows'],
                context={'user': self.context.get('user', None)}
            ).data
            data.update(
                DashboardRelatedTableSerializer(
                    model, context={'user': self.context.get('user', None)}
                ).data
            )
            data['url'] = reverse(
                'related-table-values-api',
                args=[model.object.id]
            )
            output.append(data)

        return output

    def get_filters(self, obj: Dashboard):
        """Return filters."""
        if obj.filters:
            return json.loads(obj.filters)
        else:
            return []

    def get_permission(self, obj: Dashboard):
        """Return permissions of dashboard."""
        try:
            return PermissionSerializer(obj=obj.permission).data
        except DashboardPermission.DoesNotExist:
            return PermissionSerializer(obj=DashboardPermission()).data

    def get_user_permission(self, obj: Dashboard):
        """Return permissions of dashboard."""
        try:
            return obj.permission.all_permission(
                self.context.get('user', None)
            )
        except DashboardPermission.DoesNotExist:
            return DashboardPermission().all_permission(
                self.context.get('user', None)
            )

    def get_geo_field(self, obj: Dashboard):
        """Return geofield that will be used for geometry matching on map."""
        return obj.geo_field

    def get_level_config(self, obj: Dashboard):
        """Return level_config."""
        return obj.level_config if obj.level_config else {}

    class Meta:  # noqa: D106
        model = Dashboard
        fields = (
            'id', 'slug', 'icon', 'name', 'description',
            'category', 'group',
            'extent', 'filters', 'filters_allow_modify',
            'reference_layer', 'level_config',
            'indicators', 'indicator_layers', 'indicator_layers_structure',
            'context_layers', 'context_layers_structure',
            'basemaps_layers', 'basemaps_layers_structure',
            'widgets', 'widgets_structure',
            'related_tables',
            'permission', 'user_permission',
            'geo_field', 'show_splash_first_open',
            'truncate_indicator_layer_name'
        )


class DashboardBasicSerializer(serializers.ModelSerializer):
    """Serializer for Dashboard."""

    id = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    modified_at = serializers.SerializerMethodField()
    permission = serializers.SerializerMethodField()

    def get_id(self, obj: Dashboard):
        """Return dashboard id."""
        return obj.slug

    def get_group(self, obj: Dashboard):
        """Return dashboard group name."""
        return obj.group.name if obj.group else ''

    def get_category(self, obj: Dashboard):
        """Return dashboard category name."""
        return obj.group.name if obj.group else ''

    def get_modified_at(self, obj: Dashboard):
        """Return dashboard last modified."""
        return obj.modified_at.strftime('%Y-%m-%d %H:%M:%S')

    def get_permission(self, obj: Dashboard):
        """Return permission."""
        return obj.permission.all_permission(
            self.context.get('user', None)
        )

    class Meta:  # noqa: D106
        model = Dashboard
        fields = (
            'id', 'slug', 'icon', 'name', 'modified_at',
            'description', 'group', 'category', 'permission',
            'reference_layer'
        )
