# Deployment Summary

## Modelo final

- Framework: PyTorch
- Formato principal: `.pt`
- Checkpoint seleccionado: `100_epocas`
- Ruta checkpoint origen: `checkpoints\single_object_detector_100_epochs\best_detector_100_epochs.pt`
- Modelo state_dict: `deployment\autonomous_vision_detector_final_state_dict.pt`
- Modelo TorchScript: `deployment\autonomous_vision_detector_final_torchscript.pt`

## Split del dataset

- Train: 80%
- Validation: 10%
- Test: 10%

## Resultado en test

- Test samples: 2646
- Test loss: 0.4970
- Test classification loss: 0.4130
- Test bbox loss: 0.0112
- Test accuracy: 0.8915
- Test mean IoU: 0.2259

## Conclusion

El notebook queda cerrado como una prueba completa de deteccion single-object desde cero: carga de datos, preparacion, entrenamiento, validacion, comparacion, test final y serializacion. El modelo puede reutilizarse cargando el `state_dict` con la misma arquitectura o usando la version TorchScript para inferencia.

La conclusion tecnica debe leerse con honestidad: si la accuracy es alta pero el IoU es bajo, el modelo reconoce la clase dominante mejor de lo que localiza el objeto. Para una solucion industrial de multiples objetos, el siguiente paso seria un detector multiobjeto tipo YOLO/SSD/Faster R-CNN o una cabeza grid mas avanzada.
