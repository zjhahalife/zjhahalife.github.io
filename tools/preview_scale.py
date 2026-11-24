"""Relative sizing for confirmed, flat artwork reproductions.

Physical dimensions belong to the object. Installation views and open-book
photographs include surroundings, so their image rectangle is not a ruler.
"""
import math
import re


def physical_preview(work, image_index=0):
    if 'painting' not in work.get('categories', []):
        return None
    text = work.get('size', '')
    if len(work['web_images']) > 1 and 'each' not in text.lower():
        return None
    unit = re.search(r'\b(mm|cm|m)\b', text, re.I)
    values = [float(value) for value in re.findall(r'\d+(?:\.\d+)?', text)]
    if not unit or len(values) != 2 or min(values) <= 0:
        return None
    multiplier = {'mm': .1, 'cm': 1, 'm': 100}[unit.group().lower()]
    long_edge = max(values) * multiplier
    image = work['web_images'][image_index]
    ratio = image['width'] / image['height']
    return {'long_cm': long_edge,
            'width_units': long_edge * min(1, ratio),
            'height_units': long_edge * min(1, 1 / ratio)}


def scale_policy(works):
    measured = []
    limits = [8.0]
    for work in works:
        for index, image in enumerate(work['web_images']):
            preview = physical_preview(work, index)
            if not preview:
                continue
            measured.append(preview)
            quality_width = min(image['width'] / 1.5,
                                image.get('display_max_width', image['width']))
            limits.append(quality_width / preview['width_units'])
    return {'ceiling': math.floor(min(limits) * 10) / 10,
            'max_width': max((p['width_units'] for p in measured), default=80),
            'max_height': max((p['height_units'] for p in measured), default=80),
            'images': len(measured)}


def preview_class(work, image_index=0):
    return ' physical-preview' if physical_preview(work, image_index) else ''


def preview_attributes(work, image_index=0):
    preview = physical_preview(work, image_index)
    if not preview:
        return ''
    return (f' data-physical-long-cm="{preview["long_cm"]:g}"'
            f' data-preview-width-units="{preview["width_units"]:.8f}"'
            f' data-preview-height-units="{preview["height_units"]:.8f}"')


def preview_style(work, image_index=0):
    preview = physical_preview(work, image_index)
    if not preview:
        return ''
    return (f'--preview-width-units:{preview["width_units"]:.8f};'
            f'--preview-height-units:{preview["height_units"]:.8f};')
