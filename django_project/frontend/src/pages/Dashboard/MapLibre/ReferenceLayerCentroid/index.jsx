/**
 * GeoSight is UNICEF's geospatial web-based business intelligence platform.
 *
 * Contact : geosight-no-reply@unicef.org
 *
 * .. note:: This program is free software; you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation; either version 3 of the License, or
 *     (at your option) any later version.
 *
 * __author__ = 'irwan@kartoza.com'
 * __date__ = '13/06/2023'
 * __copyright__ = ('Copyright 2023, Unicef')
 */

/* ==========================================================================
   Geometry Center
   ========================================================================== */

import React, { useEffect } from 'react';
import { useSelector } from "react-redux";
import $ from "jquery";
import maplibregl from "maplibre-gl";
import Chart from 'chart.js/auto';
import { returnWhere } from "../../../../utils/queryExtraction";
import { popupTemplate } from "../Popup";
import { addPopupEl, hasLayer, hasSource } from "../utils";
import { BEFORE_LAYER, CONTEXT_LAYER_ID } from "../Layers/ReferenceLayer";
import { extractCode } from "../../../../utils/georepo";
import { allDataIsReady } from "../../../../utils/indicators";

import './style.scss';
import {
  indicatorLayerId,
  isIndicatorLayerLikeIndicator
} from "../../../../utils/indicatorLayer";

let centroidMarker = []
let charts = {}
const INDICATOR_LABEL_ID = 'indicator-label'
let centroidConfig = {}

/**
 * GeometryCenter.
 */
export default function ReferenceLayerCentroid({ map }) {
  const {
    indicators,
    indicatorLayers
  } = useSelector(state => state.dashboard.data)
  const { showIndicatorMapLabel } = useSelector(state => state.globalState)
  const { indicatorShow } = useSelector(state => state.map)
  const geometries = useSelector(state => state.geometries)
  const filteredGeometries = useSelector(state => state.filteredGeometries)
  const indicatorsData = useSelector(state => state.indicatorsData);
  const selectedIndicatorLayer = useSelector(state => state.selectedIndicatorLayer)
  const selectedAdminLevel = useSelector(state => state.selectedAdminLevel)
  const filtersData = useSelector(state => state.filtersData);

  const where = returnWhere(filtersData ? filtersData : [])

  /**
   * Render chart
   * **/
  const renderChart = (features, config) => {
    if (JSON.stringify(config) !== JSON.stringify(centroidConfig)) {
      return;
    }
    features.map(feature => {
      const properties = feature.properties
      const chartStyle = properties.chart_style;
      const code = properties.code
      const size = chartStyle.size;
      const { labels, data, colors, options } = properties.chartData

      if (charts[code]) {
        charts[code].clear();
        $(`${code}-chart`).remove()
      }

      var el = document.createElement('div');
      const popup = new maplibregl.Popup({
        closeOnClick: false,
        closeButton: false
      }).setHTML(`<div style="display: block; box-sizing: border-box; height: ${size}px; width: ${size}px;"><canvas id="${code}-chart" width="${size}" height="${size}" data-size="${size}"></div>`)
      popup.addClassName('ChartPopup')
      const marker = new maplibregl.Marker(el)
        .setLngLat(feature.geometry.coordinates)
        .setPopup(popup)
        .addTo(map)
        .togglePopup();
      centroidMarker.push(marker)

      // Create charts
      setTimeout(function () {
        // Don't render if config is not same
        if (JSON.stringify(config) !== JSON.stringify(centroidConfig)) {
          return;
        }
        const el = document.getElementById(`${code}-chart`)
        if (!el) {
          return
        }
        const ctx = el.getContext('2d');
        try {
          const chart = new Chart(ctx, {
            type: chartStyle.chartType ? chartStyle.chartType.toLowerCase() : 'pie',
            data: {
              labels: labels,
              datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0
              }]
            },
            options: options
          });
          charts[code] = chart

          // Popup for marker
          addPopupEl(map, el, feature.geometry.coordinates, properties, properties => {
              const markerProperties = JSON.parse(JSON.stringify(properties))
              const maxValue = properties.maxValue
              const cleanProperties = {}
              markerProperties.data.map(data => {
                cleanProperties[data.name] = `
              <div class="PopupMultiDataTable">
                <div class="PopupMultiDataTableGraph" style="background-color: ${data.color}; width: ${(data.value / maxValue) * 100}%"></div>
                <div class="PopupMultiDataTableValue">${data.value}</div>
              </div>`
              })
              const name = markerProperties['name']
              cleanProperties['code'] = markerProperties['code']
              cleanProperties['label'] = markerProperties['label']
              cleanProperties['type'] = markerProperties['type']
              return popupTemplate(null, cleanProperties, {
                name: name,
                color: '#eee'
              })
            },
            {
              'bottom': [0, -1 * size],
            }
          )
        } catch (err) {

        }
      }, 200)
    })
  }

  /** Chart data generator **/
  const chartData = (indicators, style) => {
    const labels = []
    const data = []
    const colors = []
    indicators.map(indicator => {
      labels.push(indicator.name)
      data.push(indicator.value)
      colors.push(indicator.color)
    })
    const options = {
      plugins: {
        legend: {
          display: false,
        },
      },
      tooltips: { enabled: false },
      hover: { mode: null },
      events: [],
      scales: {
        x: {
          display: false,
          grid: {
            drawTicks: false,
          }
        },
        y: {
          display: false,
          grid: {
            drawTicks: false,
          }
        }
      }
    };
    return {
      labels: labels,
      data: data,
      colors: colors,
      options: options
    }
  }

  /**
   * Render label
   * **/
  const renderLabel = (features, config) => {
    const layout = {
      'text-anchor': 'bottom',
      'text-size': 14,
      'text-variable-anchor': ['center'],
    }
    const paint = {
      'text-halo-blur': 2
    }
    let minZoom = 0
    let maxZoom = 24

    // Check the style
    const { text, style } = config
    if (text && style) {
      minZoom = style.minZoom ? style.minZoom : minZoom
      maxZoom = style.maxZoom ? style.maxZoom : maxZoom
      paint['text-color'] = style.fontColor.replaceAll('##', '#')
      if (style.fontFamily) {
        layout['text-font'] = [style.fontFamily.split(',')[0].replaceAll('"', '')]
      }
      layout['text-size'] = style.fontSize
      paint['text-halo-color'] = style.haloColor.replaceAll('##', '#')
      paint['text-halo-width'] = style.haloWeight ? 1 : 0

      const textField = ['format']
      const formattedText = text.replaceAll('{', ' {{').replaceAll('}', '}} ')
      var separators = [' {', '} '];
      formattedText.split('\n').map((label, idx) => {
        label.split(new RegExp(separators.join('|'), 'g')).map(row => {
          if (row.includes('{')) {
            textField.push(['get', row.replace('{', '').replace('}', '')])
          } else if (row) {
            textField.push(row)
          }
        })
        textField.push('\n')
      })
      layout['text-field'] = textField
    }

    if (hasLayer(map, INDICATOR_LABEL_ID)) {
      map.removeLayer(INDICATOR_LABEL_ID)
    }
    if (hasSource(map, INDICATOR_LABEL_ID)) {
      map.removeSource(INDICATOR_LABEL_ID)
    }
    map.addSource(INDICATOR_LABEL_ID, {
      'type': 'geojson',
      'data': {
        type: 'FeatureCollection',
        features: features
      }
    });
    const contextLayerIds = map.getStyle().layers.filter(
      layer => layer.id.includes(CONTEXT_LAYER_ID) || layer.id === BEFORE_LAYER
    )
    map.addLayer(
      {
        id: "indicator-label",
        type: 'symbol',
        source: INDICATOR_LABEL_ID,
        filter: ['==', '$type', 'Point'],
        layout: layout,
        paint: paint,
        maxzoom: maxZoom,
        minzoom: minZoom
      },
      contextLayerIds[0]?.id
    );
  }
  /**Resetting **/
  const reset = () => {
    renderLabel([], {})
    for (const [code, chart] of Object.entries(charts)) {
      chart.clear();
      $(`${code}-chart`).remove()
    }
    centroidMarker.map(marker => marker.remove())
    centroidMarker = []
  }
  // When level changed
  useEffect(() => {
    // Check if all data is ready
    if (!selectedIndicatorLayer.indicators) {
      reset()
      return;
    }
    let rendering = true
    const usedIndicatorsData = {}
    const usedIndicatorsProperties = {}
    selectedIndicatorLayer.indicators.map(indicator => {
      usedIndicatorsData[indicator.id] = indicatorsData[indicator.id]
      usedIndicatorsProperties[indicator.id] = indicator
    })
    const layerId = indicatorLayerId(selectedIndicatorLayer)
    if (indicatorsData[layerId]) {
      usedIndicatorsData[layerId] = indicatorsData[layerId]
      usedIndicatorsProperties[layerId] = selectedIndicatorLayer
    }
    if (!allDataIsReady(usedIndicatorsData)) {
      rendering = false
    }
    // Check if geometries is exist
    const geometriesData = geometries[selectedAdminLevel.level]
    if (!geometriesData) {
      rendering = false
    }
    if (!rendering) {
      reset()
      centroidConfig = {}
      return;
    }

    const isRenderingChart = selectedIndicatorLayer?.indicators?.length >= 2

    // Check by config
    const config = {
      indicators: selectedIndicatorLayer.indicators.map(indicator => indicator.id),
      selectedIndicatorLayer: selectedIndicatorLayer.id,
      selectedIndicatorLayerConfig: isIndicatorLayerLikeIndicator(selectedIndicatorLayer) ? selectedIndicatorLayer.config : {},
      geometries: Object.keys(geometriesData),
      filteredGeometries: filteredGeometries,
      indicatorShow: indicatorShow
    }
    if (!isRenderingChart) {
      config.showIndicatorMapLabel = showIndicatorMapLabel
    }
    // If config is same, don't render to prevent flicker
    if (JSON.stringify(config) === JSON.stringify(centroidConfig)) {
      return;
    }
    reset()
    centroidConfig = config

    // If not show
    if (!indicatorShow) {
      return;
    }

    // ---------------------------------------------------------
    // CREATE CHARTS IF MULTIPLE INDICATORS
    // ---------------------------------------------------------
    if (isRenderingChart) {
      // Create data per geom
      const indicatorsByGeom = {}
      for (const [indicatorId, indicatorData] of Object.entries(usedIndicatorsData)) {
        indicatorData.data.forEach(function (data) {
          const code = extractCode(data)
          if (!indicatorsByGeom[code]) {
            indicatorsByGeom[code] = []
          }
          indicatorsByGeom[code].push(Object.assign({}, data, usedIndicatorsProperties[indicatorId]));
        })
      }
      // Creating features for center data
      let maxValue = 0
      const features = []

      const chartStyle = selectedIndicatorLayer.chart_style
      let theGeometries = Object.keys(geometriesData)
      if (where && filteredGeometries) {
        theGeometries = filteredGeometries
      }
      theGeometries.map(geom => {
        const geometry = geometriesData[geom]
        if (!geometry.centroid) {
          return
        }
        if (indicatorsByGeom[geometry?.code]) {
          const properties = Object.assign({}, geometry, {
            chart_style: JSON.parse(JSON.stringify(chartStyle)),
            name: selectedIndicatorLayer.name
          })
          properties['data'] = indicatorsByGeom[geometry.code]
          properties['chartData'] = chartData(indicatorsByGeom[geometry.code])

          // Check pie chart graph
          let total = 0
          let maxFeatureValue = 0
          indicatorsByGeom[geometry.code].map(data => {
            total += data.value
            if (data.value > maxFeatureValue) {
              maxFeatureValue = data.value
            }
          })

          // We save the max value
          if (total > maxValue) {
            maxValue = total
          }
          properties['total'] = total
          properties['maxValue'] = maxFeatureValue
          features.push({
            "type": "Feature",
            "properties": properties,
            "geometry": {
              "type": "Point",
              "coordinates": geometry.centroid.replace('POINT (', '').replace(')', '').split(' ').map(coord => parseFloat(coord))
            }
          })
        }
      })

      // Change size of pie chart
      switch (chartStyle.sizeType) {
        case "Fixed size":
          break
        default:
          // TODO:
          //  We need to split the data between
          const minSize = chartStyle.minSize
          const maxSize = chartStyle.maxSize
          const diffSize = maxSize - minSize
          features.map(feature => {
            const properties = feature.properties
            const percentageSize = properties.total / maxValue
            properties.chart_style.size = (percentageSize * diffSize) + minSize
          })
      }
      renderChart(features, config)
    } else {
      // ---------------------------------------------------------
      // CREATE LABEL IF SINGLE INDICATOR
      // ---------------------------------------------------------
      let selectedIndicatorLayerId = null
      if (selectedIndicatorLayer?.indicators) {
        selectedIndicatorLayerId = selectedIndicatorLayer?.indicators[0]?.id
      }
      const indicatorDetail = indicators.find(indicator => indicator.id === selectedIndicatorLayerId)
      let config;
      if (indicatorDetail) {
        config = indicatorDetail?.label_config
      } else {
        config = selectedIndicatorLayer?.label_config
      }
      // When there is no config, no label rendered
      if (!(config?.style && config?.text) || !showIndicatorMapLabel) {
        reset()
        return;
      }
      // ---------------------------------------------------------
      // LABEL
      // ---------------------------------------------------------
      const geometriesData = geometries[selectedAdminLevel.level]
      if (!geometriesData) {
        renderLabel([], config)
        return;
      }
      const indicatorsByGeom = {}
      const features = []
      for (const [indicatorId, indicatorData] of Object.entries(usedIndicatorsData)) {
        indicatorData.data.forEach(function (data) {
          const code = extractCode(data)
          if (!indicatorsByGeom[code]) {
            indicatorsByGeom[code] = []
          }
          indicatorsByGeom[code].push(data);
        })
      }

      let theGeometries = Object.keys(geometriesData)
      theGeometries.map(geom => {
        const geometry = geometriesData[geom]
        const code = extractCode(geometry)
        const indicator = indicatorsByGeom[code] ? indicatorsByGeom[code][0] : null
        if (filteredGeometries && !filteredGeometries.includes(code)) {
          return
        }
        let properties = geometry
        if (geometry) {
          if (indicator) {
            properties = Object.assign({}, geometry, indicator)
          }
          if (geometry.centroid) {
            features.push({
              "type": "Feature",
              "properties": properties,
              "geometry": {
                "type": "Point",
                "coordinates": geometry.centroid.replace('POINT (', '').replace(')', '').split(' ').map(coord => parseFloat(coord))
              }
            })
          }
        }
      })

      renderLabel(features, config)
    }
  }, [
    geometries, filteredGeometries, indicatorsData,
    indicatorShow, indicatorLayers, selectedIndicatorLayer,
    showIndicatorMapLabel
  ]);

  return null
}