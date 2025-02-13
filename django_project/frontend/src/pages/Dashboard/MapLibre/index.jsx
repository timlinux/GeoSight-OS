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
   MAP CONTAINER
   ========================================================================== */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import maplibregl from 'maplibre-gl';
import { MapboxOverlay } from '@deck.gl/mapbox/typed';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import ReferenceLayerCentroid from './ReferenceLayerCentroid'
import ReferenceLayer from "./Layers/ReferenceLayer";
import ContextLayers from "./Layers/ContextLayers";
import { Plugin, PluginChild } from "./Plugin";
import { removeLayer, removeSource } from "./utils"

// Toolbars
import {
  Bookmark,
  CompareLayer,
  DownloaderData,
  EmbedControl,
  GlobalDateSelector,
  Measurement,
  MovementHistories,
  TiltControl,
  LabelToggler,
  ProjectOverview
} from '../Toolbars'
import { EmbedConfig } from "../../../utils/embed";
import { Actions } from "../../../store/dashboard";

import 'maplibre-gl/dist/maplibre-gl.css';
import './style.scss';

const BASEMAP_ID = `basemap`

/**
 * MapLibre component.
 */
export default function MapLibre() {
  const dispatch = useDispatch()
  const [map, setMap] = useState(null);
  const [deckgl, setDeckGl] = useState(null);
  const extent = useSelector(state => state.dashboard.data.extent);
  const {
    basemapLayer,
    is3dMode,
    position,
    force
  } = useSelector(state => state.map);

  /**
   * FIRST INITIATE
   * */
  useEffect(() => {
    if (!map) {
      const newMap = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {},
          layers: [],
          glyphs: "/static/fonts/{fontstack}/{range}.pbf"
        },
        center: [0, 0],
        zoom: 1
      });
      newMap.once("load", () => {
        setMap(newMap)
      })
      newMap.addControl(new maplibregl.NavigationControl(), 'top-left');

      const deckgl = new MapboxOverlay({
        interleaved: true,
        layers: []
      });
      newMap.addControl(deckgl);
      setDeckGl(deckgl)

      // Event when resized
      window.addEventListener('resize', _ => {
        setTimeout(function () {
          newMap.resize();
        }, 1);
      });

    }
  }, []);


  /**
   * EXTENT CHANGED
   * */
  useEffect(() => {
    if (map && extent && !(position && Object.keys(position).length)) {
      const bounds = map.getBounds()
      const newExtent = [
        bounds._sw.lng, bounds._sw.lat,
        bounds._ne.lng, bounds._ne.lat
      ]
      if (JSON.stringify(newExtent) !== JSON.stringify(extent)) {
        setTimeout(function () {
          map.easeTo({
            pitch: 0,
            bearing: 0
          })
          setTimeout(function () {
            map.fitBounds([
              [extent[0], extent[1]],
              [extent[2], extent[3]]
            ])
          }, 100)
        }, 100)
      }
    }
  }, [map, extent]);

  /**
   * EXTENT CHANGED
   * */
  useEffect(() => {
    if (map && position && Object.keys(position).length) {
      setTimeout(function () {
        map.easeTo({
          pitch: position.pitch,
          bearing: position.bearing,
          zoom: position.zoom,
          center: position.center
        })
      }, 100)
    }
  }, [map, position]);

  /***
   * Render layer to maplibre
   * @param {String} id of layer
   * @param {Object} source Layer config options.
   * @param {Object} layer Layer config options.
   * @param {String} before Is the layer after it.
   */
  const renderLayer = (id, source, layer, before = null) => {
    removeLayer(map, id)
    removeSource(map, id)
    map.addSource(id, source)
    return map.addLayer(
      {
        ...layer,
        id: id,
        source: id,
      },
      before
    );
  }

  /** BASEMAP CHANGED */
  useEffect(() => {
    if (map && basemapLayer) {
      const layers = map.getStyle().layers.filter(layer => layer.id !== 'basemap')
      renderLayer(
        BASEMAP_ID, basemapLayer, { type: "raster" }, layers[0]?.id
      )
    }
  }, [map, basemapLayer]);

  return <section
    className={'DashboardMap ' + (!EmbedConfig().map ? 'Hidden' : '')}>
    <div id="map"></div>
    {/* TOOLBARS */}
    <div className='Toolbar'>
      <ProjectOverview/>
      <MovementHistories map={map}/>
      <TiltControl map={map} is3DView={is3dMode} force={force}/>
      <Measurement map={map}/>
      <LabelToggler/>
      <Plugin className='BookmarkControl'>
        <Bookmark map={map}/>
      </Plugin>
      <DownloaderData/>
      <CompareLayer disabled={is3dMode}/>

      {/* 3D View */}
      <Plugin>
        <PluginChild
          title={'3D layer'}
          disabled={!map}
          active={is3dMode}
          onClick={() => {
            dispatch(Actions.Map.change3DMode(!is3dMode))
          }}>
          <ViewInArIcon/>
        </PluginChild>
      </Plugin>

      {/* Embed */}
      <Plugin className='EmbedControl'>
        <PluginChild title={'Get embed code'}>
          <EmbedControl map={map}/>
        </PluginChild>
      </Plugin>
      <GlobalDateSelector/>
    </div>

    <ReferenceLayer map={map} deckgl={deckgl} is3DView={is3dMode}/>
    <ContextLayers map={map}/>
    {
      map ?
        <ReferenceLayerCentroid map={map}/> : ""
    }
  </section>
}

